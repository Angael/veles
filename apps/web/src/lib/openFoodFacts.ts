import { type } from 'arktype';

const openFoodFactsNumberType = type('number | string.numeric.parse | null').pipe((value) =>
  value !== null && Number.isFinite(value) && value >= 0 ? value : null,
);
const openFoodFactsProductType = type({
  'product_name?': 'string | null',
  'brands?': 'string | null',
  'image_url?': 'string | null',
  'product_quantity?': openFoodFactsNumberType,
  'product_quantity_unit?': 'string | null',
  'nutriments?': {
    'energy-kcal_100g?': openFoodFactsNumberType,
    'proteins_100g?': openFoodFactsNumberType,
    'fat_100g?': openFoodFactsNumberType,
    'carbohydrates_100g?': openFoodFactsNumberType,
  },
});
const openFoodFactsResponseType = type({ product: openFoodFactsProductType });

type OpenFoodFactsApiProduct = typeof openFoodFactsProductType.infer;
export type OpenFoodFactsProduct = {
  barcode: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  productSizeGrams: number | null;
  kcalPer100g: number;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbsPer100g: number | null;
};


function normalizeText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

/** Converts the subset of an Open Food Facts product that Veles stores. */
function parseProduct(
  product: OpenFoodFactsApiProduct,
  barcode: string,
): OpenFoodFactsProduct | null {
  const name = normalizeText(product.product_name);
  const kcalPer100g = product.nutriments?.['energy-kcal_100g'] ?? null;

  if (name === null || kcalPer100g === null) return null;

  const quantityUnit = normalizeText(product.product_quantity_unit)?.toLowerCase();

  return {
    barcode,
    name,
    brand: normalizeText(product.brands),
    imageUrl: normalizeText(product.image_url),
    productSizeGrams: quantityUnit === 'g' ? (product.product_quantity ?? null) : null,
    kcalPer100g,
    proteinPer100g: product.nutriments?.proteins_100g ?? null,
    fatPer100g: product.nutriments?.fat_100g ?? null,
    carbsPer100g: product.nutriments?.carbohydrates_100g ?? null,
  };
}

/** Looks up a barcode using Open Food Facts v3, falling back to v2. */
export async function getOpenFoodFactsProduct(
  barcode: string,
): Promise<OpenFoodFactsProduct | null> {
  const requestedFields = [
    'product_name',
    'brands',
    'image_url',
    'product_quantity',
    'product_quantity_unit',
    'nutriments',
  ].join(',');
  const endpoints = [
    `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}.json?fields=${requestedFields}`,
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${requestedFields}`,
  ];

  for (const endpoint of endpoints) {
    let response: Response;

    try {
      response = await fetch(endpoint, { headers: { accept: 'application/json' } });
    } catch {
      continue;
    }

    if (!response.ok) continue;

    const parsedResponse = openFoodFactsResponseType(await response.json());
    if (parsedResponse instanceof type.errors) continue;

    const product = parseProduct(parsedResponse.product, barcode);
    if (product !== null) return product;
  }

  return null;
}

