import { type } from 'arktype';
import { dateOnlyType } from '@/lib/dateOnly';

const recipeTextListType = type('string.trim[]').pipe((values) => values.filter(Boolean));

/** One ingredient for the whole recipe: a linked product, or a custom line with no nutrition. */
export const recipeIngredientInputType = type({
  '+': 'reject',
  name: type('string.trim').default(''),
  'productId?': 'string.uuid | null',
  'grams?': 'number > 0 | null',
});

/** Drops rows that have neither a product nor a name, e.g. a blank row left in the editor. */
const recipeIngredientsType = recipeIngredientInputType
  .array()
  .atMostLength(100)
  .pipe((ingredients) =>
    ingredients.filter((ingredient) => ingredient.productId || ingredient.name),
  );

export type RecipeIngredientInput = typeof recipeIngredientInputType.infer;

/** Recipe fields as JSON; ingredient amounts are for the whole recipe (all portions). */
export const recipeFieldsType = type({
  name: 'string.trim |> string >= 1',
  description: type('string.trim').default(''),
  ingredients: recipeIngredientsType.default(() => []),
  tags: recipeTextListType.default(() => []),
  portions: type('number.integer >= 1').default(1),
  rating: type('(1 <= number.integer <= 5) | null').default(null),
});

export const updateRecipeFieldsInputType = type({
  id: 'string.uuid',
  'name?': 'string.trim |> string >= 1',
  'description?': 'string.trim',
  'ingredients?': recipeIngredientsType,
  'tags?': recipeTextListType,
  'portions?': 'number.integer >= 1',
  'rating?': '(1 <= number.integer <= 5) | null',
});

export const updateRecipeRatingInputType = type({
  id: 'string.uuid',
  rating: '1 <= number.integer <= 5',
});

/** Create without id (name required), or update only the given fields with id. */
export const saveRecipeInputType = updateRecipeFieldsInputType
  .omit('id')
  .merge({ 'id?': 'string.uuid' });

/** Logs the chosen recipe ingredients; `logIds` are client ids so a retried submit adds nothing twice. */
export const logRecipeInputType = type({
  '+': 'reject',
  recipeId: 'string.uuid',
  date: dateOnlyType,
  portions: '0 < number <= 100',
  items: type({ '+': 'reject', ingredientId: 'string.uuid', logId: 'string.uuid' })
    .array()
    .atLeastLength(1)
    .atMostLength(100),
});

/** Adds recipe lines to an accessible note, or to a new shopping list when `noteId` is null. */
export const addRecipeToNoteInputType = type({
  '+': 'reject',
  noteId: 'string.uuid | null',
  title: 'string.trim |> 0 < string <= 160',
  items: type('string.trim |> 0 < string <= 240').array().atLeastLength(1).atMostLength(100),
});
