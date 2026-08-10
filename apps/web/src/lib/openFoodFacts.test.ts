import { afterEach, describe, expect, it, vi } from 'vitest';
import { getOpenFoodFactsProduct } from './openFoodFacts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getOpenFoodFactsProduct', () => {
  it('parses a v3 product and numeric strings', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        product: {
          product_name: ' Oat bar ',
          brands: ' Example Foods ',
          image_url: ' https://images.example/oat-bar.jpg ',
          product_quantity: '45.5',
          product_quantity_unit: 'g',
          nutriments: {
            'energy-kcal_100g': '412.5',
            proteins_100g: '8.2',
            carbohydrates_100g: '61',
            fat_100g: '14.25',
          },
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getOpenFoodFactsProduct('123 456')).resolves.toEqual({
      barcode: '123 456',
      name: 'Oat bar',
      brand: 'Example Foods',
      imageUrl: 'https://images.example/oat-bar.jpg',
      productSizeGrams: 45.5,
      kcalPer100g: 412.5,
      proteinPer100g: 8.2,
      carbsPer100g: 61,
      fatPer100g: 14.25,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/api/v3/product/123%20456.json');
  });

  it('falls back to v2 and parses numeric values', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        Response.json({
          status: 1,
          product: {
            product_name: 'Milk',
            brands: null,
            product_quantity: '1',
            product_quantity_unit: 'l',
            nutriments: {
              'energy-kcal_100g': 64,
              proteins_100g: 3.4,
              carbohydrates_100g: 4.8,
              fat_100g: 3.6,
            },
          },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getOpenFoodFactsProduct('987')).resolves.toEqual({
      barcode: '987',
      name: 'Milk',
      brand: null,
      imageUrl: null,
      productSizeGrams: null,
      kcalPer100g: 64,
      proteinPer100g: 3.4,
      carbsPer100g: 4.8,
      fatPer100g: 3.6,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/api/v2/product/987.json');
  });
});
