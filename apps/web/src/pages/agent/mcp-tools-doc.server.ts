import { createMcpHandler } from '@modelcontextprotocol/server';
import { type } from 'arktype';
import {
  type AgentFeature,
  agentFeatureNames,
  agentFeatures,
  type AgentPermissions,
} from '@/lib/agentAccess';
import { buildAgentServer } from './mcp-server.server';

type JsonSchema = {
  type?: string;
  format?: string;
  pattern?: string;
  enum?: unknown[];
  anyOf?: JsonSchema[];
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  not?: object;
};

type ListedTool = {
  name: string;
  description?: string;
  inputSchema: JsonSchema;
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; openWorldHint?: boolean };
};

const toolsListResponse = type({ result: { tools: 'object[]' } });

/** Lists tools the way an agent sees them, through the SDK's HTTP handler. */
async function listTools(permissions: AgentPermissions) {
  const handler = createMcpHandler(() => buildAgentServer('docs', 'the key owner', permissions));
  const response = await handler.fetch(
    new Request('http://localhost/api/mcp', {
      method: 'POST',
      headers: {
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
        'mcp-protocol-version': '2025-06-18',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
    }),
  );
  const body = await response.text();
  const data = body.split('\n').find((line) => line.startsWith('data: '));
  const parsed = toolsListResponse.assert(JSON.parse(data ? data.slice(6) : body));
  return parsed.result.tools as ListedTool[];
}

const permissionsWith = (access: { read?: boolean; write?: AgentFeature }) =>
  Object.fromEntries(
    agentFeatureNames.map((feature) => [
      feature,
      { read: access.read ?? false, write: access.write === feature },
    ]),
  ) as AgentPermissions;

function numberRange(schema: JsonSchema) {
  const low = schema.minimum ?? schema.exclusiveMinimum;
  const high = schema.maximum;
  if (low !== undefined && high !== undefined) return ` ${low}–${high}`;
  if (schema.exclusiveMinimum !== undefined) return ` > ${schema.exclusiveMinimum}`;
  if (low !== undefined) return ` ≥ ${low}`;
  return high === undefined ? '' : ` ≤ ${high}`;
}

/** Short readable type, e.g. `number 0–300`, `date`, `"up" | "down"`. */
function typeLabel(schema: JsonSchema): string {
  if (schema.enum) return schema.enum.map((value) => JSON.stringify(value)).join(' | ');
  if (schema.anyOf) {
    const labels = schema.anyOf.filter((branch) => !branch.not).map(typeLabel);
    return [...new Set(labels)].join(' | ');
  }
  if (schema.format === 'date') return 'date YYYY-MM-DD';
  if (schema.format === 'uuid') return 'uuid';
  if (schema.type === 'array') return `${schema.items ? typeLabel(schema.items) : 'unknown'}[]`;
  if (schema.type === 'object') {
    const keys = Object.keys(schema.properties ?? {});
    return keys.length ? `{ ${keys.join(', ')} }` : 'object';
  }
  if (schema.type === 'number') return `number${numberRange(schema)}`;
  return schema.type ?? 'any';
}

function notesFor(schema: JsonSchema) {
  const notes = [schema.description, ...(schema.anyOf ?? []).map((branch) => branch.description)]
    .filter((note) => note && note !== 'a UUID')
    .slice(0, 1);
  if (schema.default !== undefined) notes.push(`default ${JSON.stringify(schema.default)}`);
  if (schema.maxLength !== undefined) notes.push(`max ${schema.maxLength} chars`);
  if (schema.maxItems !== undefined) notes.push(`max ${schema.maxItems} items`);
  return notes.join('; ');
}

const cell = (value: string) => value.replaceAll('|', '\\|').replaceAll('\n', ' ');

function kind(tool: ListedTool) {
  if (tool.annotations?.readOnlyHint) return 'read';
  const tags = ['write'];
  if (tool.annotations?.destructiveHint) tags.push('destructive');
  if (tool.annotations?.openWorldHint) tags.push('shared');
  return tags.join(', ');
}

function renderTool(tool: ListedTool) {
  const lines = [`### \`${tool.name}\``, '', `_${kind(tool)}_`, '', tool.description ?? '', ''];
  const properties = Object.entries(tool.inputSchema.properties ?? {});
  if (properties.length === 0) return [...lines, 'No input.', ''];
  const required = new Set(tool.inputSchema.required);
  lines.push('| Input | Type | Required | Notes |', '| --- | --- | --- | --- |');
  for (const [name, schema] of properties) {
    lines.push(
      `| \`${name}\` | ${cell(typeLabel(schema))} | ${required.has(name) ? 'yes' : ''} | ${cell(notesFor(schema))} |`,
    );
  }
  return [...lines, ''];
}

/**
 * Renders every MCP tool as Markdown, grouped by the consent that lists it, from the same
 * `tools/list` response agents get. Run with `pnpm mcp:tools`.
 */
export async function renderAgentToolsDoc() {
  const base = await listTools(permissionsWith({}));
  const baseNames = new Set(base.map((tool) => tool.name));
  const reads = (await listTools(permissionsWith({ read: true }))).filter(
    (tool) => !baseNames.has(tool.name),
  );
  const groups: { title: string; consent: string; tools: ListedTool[] }[] = [
    { title: 'Always listed', consent: 'none', tools: base },
    { title: 'Read', consent: 'Read on any feature', tools: reads },
  ];
  for (const feature of agentFeatureNames) {
    const tools = (await listTools(permissionsWith({ write: feature }))).filter(
      (tool) => !baseNames.has(tool.name),
    );
    const label = agentFeatures[feature].label;
    groups.push({ title: `Write: ${label}`, consent: `Write on ${label}`, tools });
  }

  const lines = [
    '# Agent MCP tools',
    '',
    '<!-- Generated by `pnpm mcp:tools`. Do not edit. -->',
    '',
    'Every tool the Veles MCP server (`/api/mcp`) can list, grouped by the consent that lists it. An agent sees only the tools that its key owner allows in **Account → Agent access**. The read tool descriptions below show all resources; a key sees only the resources it may read. Setup and consent rules: [agent-integration.md](./agent-integration.md).',
    '',
    '| Tool | Consent | Kind |',
    '| --- | --- | --- |',
    ...groups.flatMap((group) =>
      group.tools.map(
        (tool) => `| [\`${tool.name}\`](#${tool.name}) | ${group.consent} | ${kind(tool)} |`,
      ),
    ),
    '',
  ];
  for (const group of groups) {
    lines.push(`## ${group.title}`, '', ...group.tools.flatMap(renderTool));
  }
  return `${lines.join('\n').trimEnd()}\n`;
}
