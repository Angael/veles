import type { McpServer } from '@modelcontextprotocol/server';
import {
  createRecipeRecord,
  updateRecipeRatingRecord,
  updateRecipeRecord,
} from '@/pages/recipes/recipes.server';
import {
  recipeFieldsType,
  updateRecipeFieldsInputType,
  updateRecipeRatingInputType,
} from '@/pages/recipes/recipes.validation';
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
    'create_recipe',
    {
      description: `Create an owned recipe. Returns { id }. ${recipeNutrition}. ingredients is one string per line.`,
      inputSchema: agentInput(recipeFieldsType),
      annotations: writeAnnotations({ destructive: false, idempotent: false }),
    },
    write(createRecipeRecord),
  );
  server.registerTool(
    'update_recipe',
    {
      description: `Change only the given fields of an owned recipe; images stay. ${recipeNutrition}. ingredients and tags replace the whole list.`,
      inputSchema: agentInput(updateRecipeFieldsInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: true }),
    },
    write(updateRecipeRecord),
  );
  server.registerTool(
    'rate_recipe',
    {
      description: 'Rate an owned recipe from 1 to 5.',
      inputSchema: agentInput(updateRecipeRatingInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: true }),
    },
    write(updateRecipeRatingRecord),
  );
}
