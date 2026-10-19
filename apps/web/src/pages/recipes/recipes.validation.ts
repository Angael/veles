import { type } from 'arktype';

const recipeTextListType = type('string.trim[]').pipe((values) => values.filter(Boolean));
const recipeAmountType = type('number >= 0 | null').default(null);

/** Recipe fields as JSON; nutrition is for the whole recipe (all portions), in kcal and grams. */
export const recipeFieldsType = type({
  name: 'string.trim |> string >= 1',
  description: type('string.trim').default(''),
  ingredients: recipeTextListType.default(() => []),
  tags: recipeTextListType.default(() => []),
  portions: type('number.integer >= 1').default(1),
  rating: type('(1 <= number.integer <= 5) | null').default(null),
  kcal: recipeAmountType,
  protein: recipeAmountType,
  fats: recipeAmountType,
  carbs: recipeAmountType,
});

export const updateRecipeFieldsInputType = type({
  id: 'string.uuid',
  'name?': 'string.trim |> string >= 1',
  'description?': 'string.trim',
  'ingredients?': recipeTextListType,
  'tags?': recipeTextListType,
  'portions?': 'number.integer >= 1',
  'rating?': '(1 <= number.integer <= 5) | null',
  'kcal?': 'number >= 0 | null',
  'protein?': 'number >= 0 | null',
  'fats?': 'number >= 0 | null',
  'carbs?': 'number >= 0 | null',
});

export const updateRecipeRatingInputType = type({
  id: 'string.uuid',
  rating: '1 <= number.integer <= 5',
});

/** Create without id (name required), or update only the given fields with id. */
export const saveRecipeInputType = updateRecipeFieldsInputType
  .omit('id')
  .merge({ 'id?': 'string.uuid' });
