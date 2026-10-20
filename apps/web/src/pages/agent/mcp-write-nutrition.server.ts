import type { McpServer } from '@modelcontextprotocol/server';
import {
  barcodeInputType,
  changeFoodLogsInputType,
  logFoodEntriesInputType,
  saveFoodProductInputType,
  setFoodDayNoteInputType,
  updateFoodLogValuesType,
} from '@/pages/calories/calories.validation';
import { setFoodDayNoteRecord } from '@/pages/calories/foodDayNotes.server';
import { changeFoodLogsRecord, logFoodEntriesRecord } from '@/pages/calories/foodLogBatch.server';
import { updateFoodLogRecord } from '@/pages/calories/foodLogs.server';
import {
  lookupFoodByBarcodeRecord,
  saveFoodProductRecord,
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
      description: `Log foods eaten on a date (YYYY-MM-DD). Each entry is { productId, grams } for a food_products item (nutrition is copied and scaled), or a custom food { name, kcal, grams?, protein?, fat?, carbs? } with ${macros} for the eaten amount. Returns the entries.`,
      inputSchema: agentInput(logFoodEntriesInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: false }),
    },
    write(logFoodEntriesRecord),
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
    'change_food_logs',
    {
      description:
        'Bulk action on food_days entries by id: delete, move (to date), copy (to date, e.g. to repeat a meal), or multiply grams, kcal and macros by factor (e.g. 2 for a double portion).',
      inputSchema: agentInput(changeFoodLogsInputType),
      annotations: writeAnnotations({ destructive: true, idempotent: false }),
    },
    write(changeFoodLogsRecord),
  );
  server.registerTool(
    'set_food_day_note',
    {
      description:
        'Set the note (free text, max 500 characters; null or "" clears it) and offPlan flag (the user went off the diet / overate) of a food_days date (YYYY-MM-DD). Omitted fields stay. Returns { date, offPlan, note }.',
      inputSchema: agentInput(setFoodDayNoteInputType),
      annotations: writeAnnotations({ destructive: true, idempotent: true }),
    },
    write(setFoodDayNoteRecord),
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
    'save_food_product',
    {
      description: `Create (no id) or replace all fields (id) of a shared catalog product that all accounts use. Search food_products first to avoid duplicates. ${per100g}. Barcodes must be unique. On update, today is the user's local date (YYYY-MM-DD): entries of that product logged today by any account are recalculated; the image stays. Returns the product.`,
      inputSchema: agentInput(saveFoodProductInputType),
      annotations: writeAnnotations({ destructive: true, idempotent: false, openWorld: true }),
    },
    write(saveFoodProductRecord),
  );
}
