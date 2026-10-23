import { and, asc, desc, eq, inArray, lt } from 'drizzle-orm';
import {
  listItems,
  notes,
  recipeImages,
  recipes,
  uploadObjects,
  weightEntries,
  weightEntryPhotos,
} from '@veles/db/schema';
import { db } from '@/server/db.server';
import { getRecipeIngredients } from '@/pages/recipes/recipeIngredients.server';
import {
  ingredientNutrition,
  isLoggableIngredient,
  type Nutrition,
  sumIngredientNutrition,
} from '@/pages/recipes/recipeNutrition';
import {
  byIdDesc,
  groupImageUrls,
  inDateRange,
  parseKey,
  type ReadQuery,
  toPage,
} from './mcp-read-helpers.server';

/** Owned notes, newest first; shopping lists carry their items instead of text content. */
export async function readNotes(userId: string, query: ReadQuery) {
  const rows = await db
    .select({
      id: notes.id,
      type: notes.type,
      title: notes.title,
      content: notes.content,
      shared: notes.shared,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(and(eq(notes.ownerId, userId), byIdDesc(notes.id, query)))
    .orderBy(desc(notes.id))
    .limit(query.limit + 1);
  const page = toPage(rows, query.limit, (note) => note.id);

  const listIds = page.items.filter((note) => note.type === 'shopping_list').map((note) => note.id);
  const items = listIds.length
    ? await db
        .select({
          id: listItems.id,
          noteId: listItems.noteId,
          name: listItems.name,
          checked: listItems.checked,
        })
        .from(listItems)
        .innerJoin(notes, eq(notes.id, listItems.noteId))
        .where(and(eq(notes.ownerId, userId), inArray(listItems.noteId, listIds)))
        .orderBy(asc(listItems.createdAt), asc(listItems.id))
    : [];
  const itemsByNote = Map.groupBy(items, (item) => item.noteId);

  return {
    nextCursor: page.nextCursor,
    items: page.items.map(({ content, ...note }) =>
      note.type === 'shopping_list'
        ? {
            ...note,
            items: (itemsByNote.get(note.id) ?? []).map(({ noteId: _noteId, ...item }) => item),
          }
        : { ...note, content },
    ),
  };
}

/** Owned weight entries, newest date first, in kg, with progress photo URLs. */
export async function readWeights(userId: string, query: ReadQuery) {
  const rows = await db
    .select({
      id: weightEntries.id,
      date: weightEntries.date,
      weightGrams: weightEntries.weightGrams,
    })
    .from(weightEntries)
    .where(
      and(
        eq(weightEntries.userId, userId),
        query.id ? eq(weightEntries.id, parseKey(query.id, 'uuid')) : undefined,
        query.cursor ? lt(weightEntries.date, parseKey(query.cursor, 'date')) : undefined,
        inDateRange(weightEntries.date, query),
      ),
    )
    .orderBy(desc(weightEntries.date))
    .limit(query.limit + 1);
  const page = toPage(rows, query.limit, (entry) => entry.date);
  const entryIds = page.items.map((entry) => entry.id);
  const photoUrls = groupImageUrls(
    entryIds.length
      ? await db
          .select({ parentId: weightEntryPhotos.weightEntryId, key: uploadObjects.key })
          .from(weightEntryPhotos)
          .innerJoin(uploadObjects, eq(uploadObjects.id, weightEntryPhotos.uploadObjectId))
          .where(inArray(weightEntryPhotos.weightEntryId, entryIds))
          .orderBy(asc(weightEntryPhotos.position))
      : [],
  );
  return {
    nextCursor: page.nextCursor,
    items: page.items.map(({ weightGrams, ...entry }) => ({
      ...entry,
      weightKg: weightGrams / 1000,
      photoUrls: photoUrls.get(entry.id) ?? [],
    })),
  };
}

const round2 = (value: number | null) => (value === null ? null : Math.round(value * 100) / 100);

/** Nutrition rounded for agents, with macros nested apart from kcal. */
function agentNutrition(nutrition: Nutrition | null) {
  if (!nutrition) return null;
  return {
    kcal: round2(nutrition.kcal),
    macros: {
      protein: round2(nutrition.protein),
      fat: round2(nutrition.fat),
      carbs: round2(nutrition.carbs),
    },
  };
}

/**
 * Owned recipes, newest first, with nested ingredients and image URLs. Nutrition comes from the
 * linked products at the recipe amounts; custom ingredients have none and are never logged.
 */
export async function readRecipes(userId: string, query: ReadQuery) {
  const rows = await db
    .select({
      id: recipes.id,
      name: recipes.name,
      description: recipes.description,
      portions: recipes.portions,
      rating: recipes.rating,
      createdAt: recipes.createdAt,
      updatedAt: recipes.updatedAt,
    })
    .from(recipes)
    .where(and(eq(recipes.userId, userId), byIdDesc(recipes.id, query)))
    .orderBy(desc(recipes.id))
    .limit(query.limit + 1);
  const page = toPage(rows, query.limit, (recipe) => recipe.id);
  const recipeIds = page.items.map((recipe) => recipe.id);
  const [imageRows, ingredientsByRecipe] = await Promise.all([
    recipeIds.length
      ? db
          .select({ parentId: recipeImages.recipeId, key: uploadObjects.key })
          .from(recipeImages)
          .innerJoin(uploadObjects, eq(uploadObjects.id, recipeImages.uploadObjectId))
          .where(inArray(recipeImages.recipeId, recipeIds))
          .orderBy(asc(recipeImages.position))
      : [],
    getRecipeIngredients(recipeIds),
  ]);
  const imageUrls = groupImageUrls(imageRows);
  return {
    nextCursor: page.nextCursor,
    items: page.items.map((recipe) => {
      const ingredients = ingredientsByRecipe.get(recipe.id) ?? [];
      return {
        ...recipe,
        imageUrls: imageUrls.get(recipe.id) ?? [],
        ingredients: ingredients.map((ingredient) => ({
          id: ingredient.id,
          name: ingredient.name,
          productId: ingredient.productId,
          grams: ingredient.grams,
          logged: isLoggableIngredient(ingredient),
          nutrition: agentNutrition(ingredientNutrition(ingredient)),
        })),
        total: agentNutrition(sumIngredientNutrition(ingredients)),
        perPortion: agentNutrition(sumIngredientNutrition(ingredients, 1 / recipe.portions)),
      };
    }),
  };
}
