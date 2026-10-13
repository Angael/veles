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
