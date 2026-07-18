import { type } from 'arktype';
import { describe, expect, it } from 'vitest';
import {
  exceedsRecipeUploadRequestLimit,
  parseRecipeUploadForm,
  RECIPE_UPLOAD_MAX_PHOTO_BYTES,
  RECIPE_UPLOAD_MAX_PHOTO_COUNT,
  RECIPE_UPLOAD_MAX_REQUEST_BYTES,
} from './recipeUploadInput';

function createValidFormData() {
  const formData = new FormData();
  formData.set('carbs', '20');
  formData.set('description', 'A useful description');
  formData.set('fats', '10');
  formData.set('ingredients', 'first\nsecond');
  formData.set('kcal', '100');
  formData.set('name', 'Recipe');
  formData.set('portions', '1');
  formData.set('protein', '30');
  formData.set('rating', '5');
  formData.set('tags', 'quick, dinner');
  return formData;
}

function expectValid(formData: FormData, files: File[] = []) {
  const result = parseRecipeUploadForm(formData, files);
  if (result instanceof type.errors) {
    throw new Error(result.summary);
  }
  expect(result).not.toBeInstanceOf(type.errors);
  return result;
}

describe('parseRecipeUploadForm', () => {
  it('trims scalar values, splits collections, and maps blank optional numbers to null', () => {
    const formData = createValidFormData();
    formData.set('name', '  Recipe  ');
    formData.set('kcal', '  ');
    formData.set('ingredients', ' first \n\n second ');
    formData.set('tags', ' quick, , dinner ');

    expect(expectValid(formData)).toMatchObject({
      ingredients: ['first', 'second'],
      kcal: null,
      name: 'Recipe',
      tags: ['quick', 'dinner'],
    });
  });

  it.each(['kcal', 'protein', 'carbs', 'fats'])(
    'rejects database-incompatible %s values',
    (field) => {
      for (const value of ['-1', '1.5', '2147483648', '1e309', 'NaN', 'Infinity']) {
        const formData = createValidFormData();
        formData.set(field, value);
        expect(parseRecipeUploadForm(formData, [])).toBeInstanceOf(type.errors);
      }
    },
  );

  it('accepts exact nutrient and portions boundaries', () => {
    const formData = createValidFormData();
    formData.set('kcal', '0');
    formData.set('protein', '2147483647');
    formData.set('portions', '2147483647');

    expect(expectValid(formData)).toMatchObject({
      kcal: 0,
      portions: 2_147_483_647,
      protein: 2_147_483_647,
    });
  });

  it.each([
    ['portions', '0'],
    ['portions', '1.5'],
    ['portions', '2147483648'],
    ['rating', '0'],
    ['rating', '1.5'],
    ['rating', '6'],
  ])('rejects invalid %s value %s', (field, value) => {
    const formData = createValidFormData();
    formData.set(field, value);
    expect(parseRecipeUploadForm(formData, [])).toBeInstanceOf(type.errors);
  });

  it('enforces text, collection, photo count, and photo size boundaries', () => {
    const exactBoundaryForm = createValidFormData();
    exactBoundaryForm.set('name', 'n'.repeat(160));
    exactBoundaryForm.set('description', 'd'.repeat(16_000));
    exactBoundaryForm.set(
      'ingredients',
      Array.from({ length: 100 }, () => 'i'.repeat(500)).join('\n'),
    );
    exactBoundaryForm.set('tags', Array.from({ length: 30 }, () => 't'.repeat(80)).join(','));
    const boundaryFiles = Array.from(
      { length: RECIPE_UPLOAD_MAX_PHOTO_COUNT },
      (_, index) =>
        new File(
          [index === 0 ? new Uint8Array(RECIPE_UPLOAD_MAX_PHOTO_BYTES) : 'x'],
          `${index}.png`,
          {
            type: 'image/png',
          },
        ),
    );

    expectValid(exactBoundaryForm, boundaryFiles);

    const cases: Array<(formData: FormData) => File[]> = [
      (formData) => {
        formData.set('name', 'n'.repeat(161));
        return [];
      },
      (formData) => {
        formData.set('description', 'd'.repeat(16_001));
        return [];
      },
      (formData) => {
        formData.set('ingredients', Array.from({ length: 101 }, () => 'i').join('\n'));
        return [];
      },
      (formData) => {
        formData.set('tags', Array.from({ length: 31 }, () => 't').join(','));
        return [];
      },
      () =>
        Array.from(
          { length: RECIPE_UPLOAD_MAX_PHOTO_COUNT + 1 },
          (_, index) => new File(['x'], `${index}.png`, { type: 'image/png' }),
        ),
      () => [
        new File([new Uint8Array(RECIPE_UPLOAD_MAX_PHOTO_BYTES + 1)], 'large.png', {
          type: 'image/png',
        }),
      ],
    ];

    for (const arrange of cases) {
      const formData = createValidFormData();
      expect(parseRecipeUploadForm(formData, arrange(formData))).toBeInstanceOf(type.errors);
    }
  });

  it('rejects malformed multipart scalar types', () => {
    const formData = createValidFormData();
    formData.set('name', new File(['name'], 'name.txt', { type: 'text/plain' }));
    expect(parseRecipeUploadForm(formData, [])).toBeInstanceOf(type.errors);
  });
});

describe('exceedsRecipeUploadRequestLimit', () => {
  it('rejects only known lengths above the request boundary', () => {
    expect(exceedsRecipeUploadRequestLimit(String(RECIPE_UPLOAD_MAX_REQUEST_BYTES))).toBe(false);
    expect(exceedsRecipeUploadRequestLimit(String(RECIPE_UPLOAD_MAX_REQUEST_BYTES + 1))).toBe(true);
    expect(exceedsRecipeUploadRequestLimit('9'.repeat(400))).toBe(true);
    expect(exceedsRecipeUploadRequestLimit(null)).toBe(false);
    expect(exceedsRecipeUploadRequestLimit('chunked')).toBe(false);
    expect(exceedsRecipeUploadRequestLimit('-1')).toBe(false);
  });
});
