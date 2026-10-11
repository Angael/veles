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
import {
  byIdDesc,
  groupImageUrls,
  inDateRange,
  parseKey,
  type ReadQuery,
  toPage,
} from './mcp-read.server';

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

const perPortion = (value: number | null, portions: number) =>
  value === null ? null : Math.round((value / portions) * 100) / 100;

/** Owned recipes, newest first, with whole-recipe and per-portion nutrition and image URLs. */
export async function readRecipes(userId: string, query: ReadQuery) {
  const rows = await db
    .select({
      id: recipes.id,
      name: recipes.name,
      description: recipes.description,
      ingredients: recipes.ingredients,
      tags: recipes.tags,
      portions: recipes.portions,
      rating: recipes.rating,
      kcal: recipes.kcal,
      protein: recipes.protein,
      fat: recipes.fats,
      carbs: recipes.carbs,
      createdAt: recipes.createdAt,
      updatedAt: recipes.updatedAt,
    })
    .from(recipes)
    .where(and(eq(recipes.userId, userId), byIdDesc(recipes.id, query)))
    .orderBy(desc(recipes.id))
    .limit(query.limit + 1);
  const page = toPage(rows, query.limit, (recipe) => recipe.id);
  const recipeIds = page.items.map((recipe) => recipe.id);
  const imageUrls = groupImageUrls(
    recipeIds.length
      ? await db
          .select({ parentId: recipeImages.recipeId, key: uploadObjects.key })
          .from(recipeImages)
          .innerJoin(uploadObjects, eq(uploadObjects.id, recipeImages.uploadObjectId))
          .where(inArray(recipeImages.recipeId, recipeIds))
          .orderBy(asc(recipeImages.position))
      : [],
  );
  return {
    nextCursor: page.nextCursor,
    items: page.items.map(({ kcal, protein, fat, carbs, ...recipe }) => ({
      ...recipe,
      imageUrls: imageUrls.get(recipe.id) ?? [],
      total: { kcal, macros: { protein, fat, carbs } },
      perPortion: {
        kcal: perPortion(kcal, recipe.portions),
        macros: {
          protein: perPortion(protein, recipe.portions),
          fat: perPortion(fat, recipe.portions),
          carbs: perPortion(carbs, recipe.portions),
        },
      },
    })),
  };
}
