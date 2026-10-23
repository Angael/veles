import { type } from 'arktype';
import type { AgentFeature } from '@/lib/agentAccess';
import { readFoodDays, readCalorieGoals, readFoodProducts } from './mcp-read-nutrition.server';
import { readNotes, readRecipes, readWeights } from './mcp-read-personal.server';
import { isoDate, type ReadPage, type ReadQuery } from './mcp-read-helpers.server';
import {
  readWorkoutExercises,
  readWorkoutRoutines,
  readWorkoutSessions,
} from './mcp-read-workouts.server';

export interface AgentResource {
  feature: AgentFeature;
  description: string;
  /** Accepts `from`/`to` date filters. */
  dated: boolean;
  /** Owner-scoped read that returns nested, readable records; `query.id` selects one. */
  read: (userId: string, query: ReadQuery) => Promise<ReadPage>;
}

const kcalAndMacros = 'kcal is energy; macros are protein, fat, carbs in grams';
const setFields =
  'Sets: id, type (normal, warmup, drop, failure), done, weightKg, reps, durationSeconds, distanceKm; measure says which apply.';

export const resources = {
  notes: {
    feature: 'notes',
    dated: false,
    description:
      'Notes and shopping lists. Notes have content; shopping lists (type "shopping_list") have items (id, name, checked) in list order instead.',
    read: readNotes,
  },
  weights: {
    feature: 'weight',
    dated: true,
    description:
      'Weight history in kg, newest date first, with photoUrls (progress photos). Cursor and from/to are dates.',
    read: readWeights,
  },
  recipes: {
    feature: 'recipes',
    dated: false,
    description: `Recipes with tags, imageUrls, and ingredients in order. Ingredient grams are for the whole recipe (portions = how many portions it makes). A linked ingredient has productId (from food_products) and nutrition at its grams; a custom one has productId null, nutrition null, and logged false, as it is never written to the food log. total (all portions) and perPortion sum the linked ingredients and are null when none has nutrition; ${kcalAndMacros}.`,
    read: readRecipes,
  },
  food_days: {
    feature: 'calories',
    dated: true,
    description: `Food diary, one item per day with entries or a day note, newest first; id and date are the same YYYY-MM-DD. Each day has entries (with imageUrl or null, and productId when logged from food_products), total, goal (the nutrition goal in effect; null without a goal or without Nutrition goals consent), note (the user's free text or null), and offPlan; ${kcalAndMacros}. offPlan true means the user went off the diet and probably overate: total is only what was logged, not the real intake, so use the note to judge how much more was eaten, and leave the day out of averages and trends.`,
    read: readFoodDays,
  },
  calorie_goals: {
    feature: 'calorie_goals',
    dated: true,
    description: `Nutrition goal history by effectiveDate, newest first; each goal applies until the next one. ${kcalAndMacros} (limits).`,
    read: readCalorieGoals,
  },
  food_products: {
    feature: 'food_products',
    dated: false,
    description: `Shared food catalog with imageUrl or null. per100g nutrition: ${kcalAndMacros}. productSizeGrams is one package.`,
    read: readFoodProducts,
  },
  workout_sessions: {
    feature: 'workouts',
    dated: true,
    description: `Workout sessions, newest first, each with its exercises (id of the session exercise, exerciseId from workout_exercises, name, measure, notes) and their sets. ${setFields} durationSeconds is manual or end minus start.`,
    read: readWorkoutSessions,
  },
  workout_routines: {
    feature: 'workouts',
    dated: false,
    description:
      'Reusable workout plans, each with ordered exercises (name, measure, restSeconds) and setTypes, one per planned set.',
    read: readWorkoutRoutines,
  },
  workout_exercises: {
    feature: 'workouts',
    dated: false,
    description:
      'Exercise list with measure, restSeconds, notes, archived, lastDoneOn, and sessionCount.',
    read: readWorkoutExercises,
  },
} satisfies Record<string, AgentResource>;

type ResourceName = keyof typeof resources;

const resourceName = type.enumerated(...(Object.keys(resources) as ResourceName[]));
export const listInput = type({
  resource: resourceName,
  'cursor?': type('string > 0').describe('nextCursor from the previous page'),
  'limit?': '1 <= number.integer <= 100',
  'from?': isoDate.describe('earliest date, inclusive (dated resources only)'),
  'to?': isoDate.describe('latest date, inclusive (dated resources only)'),
});
export const getInput = type({
  resource: resourceName,
  id: type('string > 0').describe('record UUID; a YYYY-MM-DD date for food_days'),
});
