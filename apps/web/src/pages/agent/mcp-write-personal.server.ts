import type { McpServer } from '@modelcontextprotocol/server';
import { saveRecipeRecord } from '@/pages/recipes/recipes.server';
import { saveRecipeInputType } from '@/pages/recipes/recipes.validation';
import { saveWeightRecord } from '@/pages/weight/weight.server';
import { saveWeightInputType } from '@/pages/weight/weight.validation';
import { agentInput, agentWriter, writeAnnotations } from './mcp-tools.server';

const recipeNutrition =
  'kcal, protein, fats, carbs are whole numbers for the whole recipe (all portions), in kcal and grams';

/** Weight writes; photos are added in the app and stay linked when the weight changes. */
export function registerWeightTools(server: McpServer, userId: string) {
  const write = agentWriter(userId, 'weight');

  server.registerTool(
    'save_weight',
    {
      description:
        'Save the weight in kg for one date. Replaces the weight already saved for that date; photos stay.',
      inputSchema: agentInput(saveWeightInputType),
      annotations: writeAnnotations({ destructive: true, idempotent: true }),
    },
    write(saveWeightRecord),
  );
}

/** Recipe writes; images are managed in the app and are kept on update. */
export function registerRecipeTools(server: McpServer, userId: string) {
  const write = agentWriter(userId, 'recipes');

  server.registerTool(
    'save_recipe',
    {
      description: `Create (no id; name required) or update (id) an owned recipe. Omitted fields stay; images stay. ${recipeNutrition}. ingredients (one string per line) and tags replace the whole list. rating is 1–5. Returns { id }.`,
      inputSchema: agentInput(saveRecipeInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: false }),
    },
    write(saveRecipeRecord),
  );
}
