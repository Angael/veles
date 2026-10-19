import type { McpServer } from '@modelcontextprotocol/server';
import {
  barcodeInputType,
  createFoodProductValuesType,
  foodLogIdsInputType,
  foodLogsDateInputType,
  multiplyFoodLogsInputType,
  recordCustomCaloriesValuesType,
  recordFoodValuesType,
  updateFoodLogValuesType,
  updateFoodProductValuesType,
} from '@/pages/calories/calories.validation';
import {
  copyFoodLogsRecord,
  deleteFoodLogsRecord,
  moveFoodLogsRecord,
  multiplyFoodLogsRecord,
  recordCustomCaloriesRecord,
  recordFoodRecord,
  updateFoodLogRecord,
} from '@/pages/calories/foodLogs.server';
import {
  createFoodProductRecord,
  lookupFoodByBarcodeRecord,
  updateFoodProductRecord,
} from '@/pages/calories/foodProducts.server';
import { setDailyCalorieGoalRecord } from '@/pages/calories/goals/goals.server';
import { setDailyCalorieGoalInputType } from '@/pages/calories/goals/goals.validation';
import { agentInput, agentWriter, writeAnnotations } from './mcp-tools.server';

const macros = 'protein, fat, carbs in grams';

/** Food diary writes on the owner's food logs; photos are managed in the app. */
export function registerFoodDiaryTools(server: McpServer, userId: string) {
  const write = agentWriter(userId, 'calories');

  server.registerTool(
    'log_food',
    {
      description:
        'Log grams of a food_products item on a date (YYYY-MM-DD). Nutrition is copied from the product and scaled to grams. Returns the entry.',
      inputSchema: agentInput(recordFoodValuesType),
      annotations: writeAnnotations({ destructive: false, idempotent: false }),
    },
    write(recordFoodRecord),
  );
  server.registerTool(
    'log_custom_food',
    {
      description: `Log a food that is not in the catalog on a date, with kcal and optional grams and ${macros} for the eaten amount. Returns the entry.`,
      inputSchema: agentInput(recordCustomCaloriesValuesType.omit('imageAction')),
      annotations: writeAnnotations({ destructive: false, idempotent: false }),
    },
    write(recordCustomCaloriesRecord),
  );
  server.registerTool(
    'update_food_log',
    {
      description: `Edit a food_days entry by id; send all fields. Entries with a productId keep their name and scale nutrition by the new grams; other entries take name, kcal and ${macros} as given. date moves the entry. Returns the entry.`,
      inputSchema: agentInput(updateFoodLogValuesType.omit('imageAction')),
      annotations: writeAnnotations({ destructive: false, idempotent: true }),
    },
    write(updateFoodLogRecord),
  );
  server.registerTool(
    'delete_food_logs',
    {
      description: 'Delete food_days entries by id (up to 200).',
      inputSchema: agentInput(foodLogIdsInputType),
      annotations: writeAnnotations({ destructive: true, idempotent: true }),
    },
    write(deleteFoodLogsRecord),
  );
  server.registerTool(
    'move_food_logs',
    {
      description: 'Move food_days entries by id to another date.',
      inputSchema: agentInput(foodLogsDateInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: true }),
    },
    write(moveFoodLogsRecord),
  );
  server.registerTool(
    'copy_food_logs',
    {
      description: 'Copy food_days entries by id to another date, e.g. to repeat a meal.',
      inputSchema: agentInput(foodLogsDateInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: false }),
    },
    write(copyFoodLogsRecord),
  );
  server.registerTool(
    'multiply_food_logs',
    {
      description:
        'Multiply grams, kcal and macros of food_days entries by factor (0 < factor <= 20), e.g. 2 for a double portion.',
      inputSchema: agentInput(multiplyFoodLogsInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: false }),
    },
    write(multiplyFoodLogsRecord),
  );
}

export function registerCalorieGoalTools(server: McpServer, userId: string) {
  const write = agentWriter(userId, 'calorie_goals');

  server.registerTool(
    'set_calorie_goal',
    {
      description: `Set the daily nutrition goal that applies from date until the next goal: kcal and optional ${macros}. Replaces a goal with the same date. Returns the goal.`,
      inputSchema: agentInput(setDailyCalorieGoalInputType),
      annotations: writeAnnotations({ destructive: true, idempotent: true }),
    },
    write(setDailyCalorieGoalRecord),
  );
}

/** Shared catalog writes: changes are visible to every Veles account. */
export function registerFoodCatalogTools(server: McpServer, userId: string) {
  const write = agentWriter(userId, 'food_products');
  const per100g = `kcalPer100g and optional proteinPer100g, fatPer100g, carbsPer100g (grams per 100 g); productSizeGrams is one package`;

  server.registerTool(
    'lookup_food_barcode',
    {
      description:
        'Find a catalog product by barcode. If it is missing, import it from Open Food Facts into the shared catalog. Returns { status: "found", food } or { status: "notFound" }.',
      inputSchema: agentInput(barcodeInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: true, openWorld: true }),
    },
    write(lookupFoodByBarcodeRecord),
  );
  server.registerTool(
    'create_food_product',
    {
      description: `Add a product to the shared catalog that all accounts use. Search food_products first to avoid duplicates. ${per100g}. Barcodes must be unique. Returns the product.`,
      inputSchema: agentInput(createFoodProductValuesType.omit('imageAction')),
      annotations: writeAnnotations({ destructive: false, idempotent: false, openWorld: true }),
    },
    write(createFoodProductRecord),
  );
  server.registerTool(
    'update_food_product',
    {
      description: `Replace the fields of a shared catalog product; send all fields. ${per100g}. today is the user's local date (YYYY-MM-DD): entries of that product logged today by any account are recalculated. The image stays. Returns the product.`,
      inputSchema: agentInput(updateFoodProductValuesType.omit('imageAction')),
      annotations: writeAnnotations({ destructive: true, idempotent: true, openWorld: true }),
    },
    write(updateFoodProductRecord),
  );
}
