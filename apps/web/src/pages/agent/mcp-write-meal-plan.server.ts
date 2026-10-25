import type { McpServer } from '@modelcontextprotocol/server';
import {
  deleteMealPlanItemRecord,
  saveMealPlanItemRecord,
} from '@/pages/meal-plan/mealPlan.server';
import {
  deleteMealPlanItemInputType,
  saveMealPlanItemInputType,
} from '@/pages/meal-plan/mealPlan.validation';
import { agentInput, agentWriter, writeAnnotations } from './mcp-tools.server';

/** Meal plan writes; planning never logs food, so the diary stays unchanged. */
export function registerMealPlanTools(server: McpServer, userId: string) {
  const write = agentWriter(userId, 'meal_plan');

  server.registerTool(
    'save_meal_plan_item',
    {
      description:
        'Create (no id) or update (id) a planned meal on a date. Set recipeId to an own recipe (name may be empty; the recipe name is used) or null with a name for a free-text meal. portions is how many portions to eat. Changing date moves the meal. Does not log food. Returns { id }.',
      inputSchema: agentInput(saveMealPlanItemInputType),
      annotations: writeAnnotations({ destructive: true, idempotent: false }),
    },
    write(saveMealPlanItemRecord),
  );
  server.registerTool(
    'delete_meal_plan_item',
    {
      description: 'Delete one planned meal. The food diary does not change.',
      inputSchema: agentInput(deleteMealPlanItemInputType),
      annotations: writeAnnotations({ destructive: true, idempotent: false }),
    },
    write(deleteMealPlanItemRecord),
  );
}
