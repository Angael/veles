import { eq, inArray } from 'drizzle-orm';
import {
  diaryEntries,
  listItems,
  notes,
  recipeImages,
  recipeLastViews,
  recipes,
  uploadObjects,
  weightEntries,
} from '@veles/db/schema';
import { db } from '@/server/db.server';
import { storagePathToUrl } from '@/server/storage/config.server';
import { defineAgentResource } from './resource.server';

const ownedNoteIds = (userId: string) =>
  db.select({ id: notes.id }).from(notes).where(eq(notes.ownerId, userId));
const ownedRecipeIds = (userId: string) =>
  db.select({ id: recipes.id }).from(recipes).where(eq(recipes.userId, userId));

const uploadResource = defineAgentResource(
  'uploads',
  'Your upload metadata. Public uploads also include a URL; no storage credentials are exposed.',
  uploadObjects,
  {
    mimeType: uploadObjects.mimeType,
    createdAt: uploadObjects.createdAt,
    key: uploadObjects.key,
    bucket: uploadObjects.bucket,
  },
  uploadObjects.id,
  (userId) => eq(uploadObjects.userId, userId),
);

export const contentResources = [
  defineAgentResource(
    'diary_entries',
    'Your diary, including full Markdown content and entry dates.',
    diaryEntries,
    {
      title: diaryEntries.title,
      markdown: diaryEntries.markdown,
      entryDate: diaryEntries.entryDate,
      createdAt: diaryEntries.createdAt,
      updatedAt: diaryEntries.updatedAt,
    },
    diaryEntries.id,
    (userId) => eq(diaryEntries.userId, userId),
  ),
  defineAgentResource(
    'notes',
    'Your notes and shopping lists. Fetch list_items separately using noteId.',
    notes,
    {
      type: notes.type,
      title: notes.title,
      content: notes.content,
      shared: notes.shared,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    },
    notes.id,
    (userId) => eq(notes.ownerId, userId),
  ),
  defineAgentResource(
    'list_items',
    'Items in your shopping lists, including their checked state and noteId.',
    listItems,
    {
      noteId: listItems.noteId,
      name: listItems.name,
      checked: listItems.checked,
      createdAt: listItems.createdAt,
    },
    listItems.id,
    (userId) => inArray(listItems.noteId, ownedNoteIds(userId)),
  ),
  defineAgentResource(
    'weights',
    'Your weight history. weightGrams is an integer number of grams; divide by 1000 for kg.',
    weightEntries,
    {
      date: weightEntries.date,
      weightGrams: weightEntries.weightGrams,
    },
    weightEntries.id,
    (userId) => eq(weightEntries.userId, userId),
  ),
  defineAgentResource(
    'recipes',
    'Your recipes, ingredients, tags, portions and rating. Nutrition totals cover the stored portions: kcal is energy; protein, fats, carbs are grams.',
    recipes,
    {
      name: recipes.name,
      description: recipes.description,
      ingredients: recipes.ingredients,
      tags: recipes.tags,
      portions: recipes.portions,
      rating: recipes.rating,
      kcal: recipes.kcal,
      protein: recipes.protein,
      fats: recipes.fats,
      carbs: recipes.carbs,
      createdAt: recipes.createdAt,
      updatedAt: recipes.updatedAt,
    },
    recipes.id,
    (userId) => eq(recipes.userId, userId),
  ),
  defineAgentResource(
    'recipe_images',
    'Images attached to your recipes. Resolve uploadObjectId through uploads; position defines image order.',
    recipeImages,
    {
      recipeId: recipeImages.recipeId,
      uploadObjectId: recipeImages.uploadObjectId,
      position: recipeImages.position,
      createdAt: recipeImages.createdAt,
    },
    recipeImages.id,
    (userId) => inArray(recipeImages.recipeId, ownedRecipeIds(userId)),
  ),
  defineAgentResource(
    'recipe_last_views',
    'Your legacy recipe view history (the app no longer updates it). id is the recipeId.',
    recipeLastViews,
    {
      recipeId: recipeLastViews.recipeId,
      viewedAt: recipeLastViews.viewedAt,
    },
    recipeLastViews.recipeId,
    (userId) => eq(recipeLastViews.userId, userId),
  ),
  {
    ...uploadResource,
    fields: [...uploadResource.fields, 'url'],
    async read(input: Parameters<typeof uploadResource.read>[0]) {
      const page = await uploadResource.read(input);
      return {
        ...page,
        items: page.items.map((item) => ({
          ...item,
          url:
            item.bucket === 'public' && typeof item.key === 'string'
              ? storagePathToUrl(item.key)
              : null,
        })),
      };
    },
  },
];
