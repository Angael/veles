import type { McpServer } from '@modelcontextprotocol/server';
import { saveRecipeRecord } from '@/pages/recipes/recipes.server';
import { saveRecipeInputType } from '@/pages/recipes/recipes.validation';
import { saveWeightRecord } from '@/pages/weight/weight.server';
import { saveWeightInputType } from '@/pages/weight/weight.validation';
import { agentInput, agentWriter, writeAnnotations } from './mcp-tools.server';

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

/** Recipe writes; images change only when the agent sends `imageUrls`. */
export function registerRecipeTools(server: McpServer, userId: string) {
  const write = agentWriter(userId, 'recipes');

  server.registerTool(
    'save_recipe',
    {
      description:
        'Create (no id; name required) or update (id) an own or friend-shared recipe. Omitted fields stay. portions is how many portions the recipe makes. ingredients replace the whole list; grams are for the whole recipe. Link each ingredient to a product so the recipe gets kcal and macros: search food_products by name, then send { productId, grams } (name defaults to the product name). Send { name, grams? } only when no product fits; that line has no nutrition. imageUrls replace the whole photo list in order: keep a photo with its URL from recipes, add one with a public https image URL. rating is 1–5. Returns { id }.',
      inputSchema: agentInput(saveRecipeInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: false, openWorld: true }),
    },
    write(saveRecipeRecord),
  );
}
