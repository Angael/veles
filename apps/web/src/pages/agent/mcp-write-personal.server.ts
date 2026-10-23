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

/** Recipe writes; images are managed in the app and are kept on update. */
export function registerRecipeTools(server: McpServer, userId: string) {
  const write = agentWriter(userId, 'recipes');

  server.registerTool(
    'save_recipe',
    {
      description:
        'Create (no id; name required) or update (id) an owned recipe. Omitted fields stay; images stay. portions is how many portions the recipe makes. ingredients replace the whole list. Each ingredient is { productId, grams } for a food_products product (name is optional and defaults to the product name; nutrition comes from the product), or { name, grams? } for a custom line with no nutrition that is never logged. grams are for the whole recipe. rating is 1–5. Returns { id }.',
      inputSchema: agentInput(saveRecipeInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: false }),
    },
    write(saveRecipeRecord),
  );
}
