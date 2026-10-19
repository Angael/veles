import { McpServer } from '@modelcontextprotocol/server';
import { users } from '@veles/db/schema';
import { eq } from 'drizzle-orm';
import type { AgentPermissions } from '@/lib/agentAccess';
import { readAgentPermissions } from '@/server/agentAccess.server';
import { db } from '@/server/db.server';
import { registerReadTools } from './mcp-read-tools.server';
import { registerNoteTools } from './mcp-write-notes.server';
import {
  registerCalorieGoalTools,
  registerFoodCatalogTools,
  registerFoodDiaryTools,
} from './mcp-write-nutrition.server';
import { registerRecipeTools, registerWeightTools } from './mcp-write-personal.server';
import { registerWorkoutTools } from './mcp-write-workouts.server';

/**
 * Builds the MCP server for one key owner: only tools that current consent allows are listed.
 * Live checks inside each tool still enforce consent at call time.
 */
export function buildAgentServer(userId: string, ownerName: string, permissions: AgentPermissions) {
  // One key = one person; agents serving several people get one server per key.
  const server = new McpServer(
    { name: 'veles', version: '2.0.0' },
    {
      instructions: `This connection reads and writes the Veles account of ${ownerName} only. Other people's Veles accounts use separate connections, usually named veles-<first name>. Save changes to the account of the person who asks, unless they clearly name another person.`,
    },
  );

  registerReadTools(server, userId, ownerName, permissions);
  if (permissions.notes.write) registerNoteTools(server, userId);
  if (permissions.weight.write) registerWeightTools(server, userId);
  if (permissions.recipes.write) registerRecipeTools(server, userId);
  if (permissions.calories.write) registerFoodDiaryTools(server, userId);
  if (permissions.calorie_goals.write) registerCalorieGoalTools(server, userId);
  if (permissions.food_products.write) registerFoodCatalogTools(server, userId);
  if (permissions.workouts.write) registerWorkoutTools(server, userId);
  return server;
}

/** Loads the key owner's name and current consent, then builds their server. */
export async function createAgentServer(userId: string) {
  const [owner] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId));
  const permissions = await readAgentPermissions(userId);
  return buildAgentServer(userId, owner?.name ?? 'unknown user', permissions);
}
