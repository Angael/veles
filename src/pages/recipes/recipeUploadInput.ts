import { ArkErrors, type } from 'arktype';

export const RECIPE_UPLOAD_MAX_PHOTO_COUNT = 8;
export const RECIPE_UPLOAD_MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const RECIPE_UPLOAD_MAX_REQUEST_BYTES = 82 * 1024 * 1024;

const POSTGRES_INTEGER_MAX = 2_147_483_647;
const optionalNutrientFormValueType = type('string.trim').pipe((value): number | null | ArkErrors =>
  value === ''
    ? null
    : type(`string.numeric.parse |> 0 <= number.integer <= ${POSTGRES_INTEGER_MAX}`)(value),
);
const optionalRatingFormValueType = type('string.trim').pipe((value): number | null | ArkErrors =>
  value === '' ? null : type('string.numeric.parse |> 1 <= number.integer <= 5')(value),
);
const portionsFormValueType = type('string.trim').pipe((value): number | ArkErrors =>
  type(`string.numeric.parse |> 1 <= number.integer <= ${POSTGRES_INTEGER_MAX}`)(value),
);
const recipeUploadFormType = type({
  carbs: optionalNutrientFormValueType,
  description: 'string.trim |> string <= 16000',
  fats: optionalNutrientFormValueType,
  ingredients: 'string <= 64000',
  kcal: optionalNutrientFormValueType,
  name: 'string.trim |> 1 <= string <= 160',
  portions: portionsFormValueType,
  protein: optionalNutrientFormValueType,
  rating: optionalRatingFormValueType,
  tags: 'string <= 4000',
});
const recipePhotosType = type(`File[] <= ${RECIPE_UPLOAD_MAX_PHOTO_COUNT}`).narrow(
  (files, context) =>
    files.every((file) => file.size <= RECIPE_UPLOAD_MAX_PHOTO_BYTES) ||
    context.mustBe(`files no larger than ${RECIPE_UPLOAD_MAX_PHOTO_BYTES} bytes`),
);
const recipeUploadInputType = type({
  carbs: 'number | null',
  description: 'string <= 16000',
  fats: 'number | null',
  ingredients: '(string <= 500)[] <= 100',
  kcal: 'number | null',
  name: '1 <= string <= 160',
  photos: recipePhotosType,
  portions: `1 <= number.integer <= ${POSTGRES_INTEGER_MAX}`,
  protein: 'number | null',
  rating: 'number | null',
  tags: '(string <= 80)[] <= 30',
});

/** Parses multipart scalar values into the bounded shape accepted by recipe persistence. */
export function parseRecipeUploadForm(formData: FormData, files: File[]) {
  const ingredientsValue = formData.get('ingredients');
  const tagsValue = formData.get('tags');
  const formValidation = recipeUploadFormType({
    carbs: formData.get('carbs'),
    description: formData.get('description'),
    fats: formData.get('fats'),
    ingredients: typeof ingredientsValue === 'string' ? ingredientsValue : '',
    kcal: formData.get('kcal'),
    name: formData.get('name'),
    portions: formData.get('portions'),
    protein: formData.get('protein'),
    rating: formData.get('rating'),
    tags: typeof tagsValue === 'string' ? tagsValue : '',
  });

  if (formValidation instanceof type.errors) {
    return formValidation;
  }

  return recipeUploadInputType({
    ...formValidation,
    ingredients: splitAndTrim(formValidation.ingredients, '\n'),
    photos: files,
    tags: splitAndTrim(formValidation.tags, ','),
  });
}

export function exceedsRecipeUploadRequestLimit(contentLength: string | null) {
  if (contentLength === null || !/^\d+$/.test(contentLength)) {
    return false;
  }

  const parsedLength = Number(contentLength);
  return !Number.isSafeInteger(parsedLength) || parsedLength > RECIPE_UPLOAD_MAX_REQUEST_BYTES;
}

function splitAndTrim(value: string, separator: string) {
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}
