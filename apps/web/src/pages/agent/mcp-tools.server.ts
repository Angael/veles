import type { StandardSchemaV1, StandardSchemaWithJSON } from '@modelcontextprotocol/server';
import type { AgentFeature } from '@/lib/agentAccess';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { requireAgentAccess } from '@/server/agentAccess.server';
import { log } from '@/server/logger.server';

export const jsonResult = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value) }],
});

/** Checks live consent and returns safe MCP tool errors without exposing database details. */
export async function runAgentTool(
  userId: string,
  feature: AgentFeature,
  access: 'read' | 'write',
  operation: () => Promise<unknown>,
) {
  try {
    await requireAgentAccess(userId, feature, access);
    const result = await operation();
    return jsonResult(result === undefined ? { success: true } : result);
  } catch (error) {
    if (!(error instanceof ClientSafeError)) {
      log.error('MCP tool failed', {
        feature,
        access,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return {
      ...jsonResult({
        error: error instanceof ClientSafeError ? error.message : 'Operation failed.',
      }),
      isError: true,
    };
  }
}

/**
 * arktype cannot put these in JSON Schema: a `narrow()` check is advertised as its base type, and
 * an `| undefined` branch of an optional key as a schema that matches nothing.
 */
const jsonSchemaFallback = {
  predicate: (context: { base: unknown }) => context.base,
  unit: (context: { base: unknown; unit: unknown }) =>
    context.unit === undefined ? { not: {} } : context.base,
};

type JsonNode = { [key: string]: unknown };

const isJsonNode = (value: unknown): value is JsonNode =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Shrinks arktype's JSON Schema for agents: a UUID is a three-branch `anyOf` with a regex and an
 * ISO date is a long regex, together ~40% of `tools/list`. Agents load every listed schema into
 * context, so these become `format` hints. Validation still runs the full arktype check.
 */
function slimSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(slimSchema);
  if (!isJsonNode(node)) return node;
  const description = node.description === 'a UUID' ? undefined : node.description;
  if (node.format === 'uuid') return { type: 'string', format: 'uuid', description };
  if (typeof node.pattern === 'string' && node.pattern.includes('W([0-4]')) {
    return { type: 'string', format: 'date', description };
  }
  return Object.fromEntries(
    Object.entries(node)
      .filter(([key]) => key !== '$schema')
      .map(([key, value]) => [key, slimSchema(value)]),
  );
}

/**
 * Makes an arktype input schema listable in `tools/list`. Without this, one predicate (e.g. a real
 * calendar date check) or `| undefined` makes the SDK throw for every tool. Validation still runs
 * the full check.
 */
export function agentInput<S extends StandardSchemaWithJSON>(
  schema: S,
): StandardSchemaWithJSON<StandardSchemaV1.InferInput<S>, StandardSchemaV1.InferOutput<S>> {
  const standard = schema['~standard'];
  const withFallback =
    (convert: typeof standard.jsonSchema.input): typeof standard.jsonSchema.input =>
    (options) => {
      const full = convert({
        ...options,
        libraryOptions: { ...options.libraryOptions, fallback: jsonSchemaFallback },
      });
      const slim = slimSchema(full);
      return isJsonNode(slim) ? slim : full;
    };
  return {
    '~standard': {
      ...standard,
      jsonSchema: {
        input: withFallback(standard.jsonSchema.input),
        output: withFallback(standard.jsonSchema.output),
      },
    },
  };
}

type WriteHints = { destructive: boolean; idempotent: boolean; openWorld?: boolean };

export const writeAnnotations = (hints: WriteHints) => ({
  readOnlyHint: false,
  destructiveHint: hints.destructive,
  idempotentHint: hints.idempotent,
  openWorldHint: hints.openWorld ?? false,
});

/** Wraps an app operation as a tool handler that rechecks live write consent on every call. */
export function agentWriter(userId: string, feature: AgentFeature) {
  return <T>(operation: (userId: string, data: T) => Promise<unknown>) =>
    async (data: T) =>
      runAgentTool(userId, feature, 'write', () => operation(userId, data));
}
