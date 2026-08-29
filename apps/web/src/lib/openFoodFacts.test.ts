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
            fat_100g: '14.25',
            carbohydrates_100g: '61',
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
      fatPer100g: 14.25,
      carbsPer100g: 61,
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
              fat_100g: 3.6,
              carbohydrates_100g: 4.8,
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
      fatPer100g: 3.6,
      carbsPer100g: 4.8,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/api/v2/product/987.json');
  });
  it('falls back to v2 when v3 returns invalid JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('<html>temporarily unavailable</html>', { status: 200 }))
      .mockResolvedValueOnce(
        Response.json({
          product: {
            product_name: 'Fallback food',
            nutriments: {
              'energy-kcal_100g': 123,
            },
          },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getOpenFoodFactsProduct('654')).resolves.toEqual({
      barcode: '654',
      name: 'Fallback food',
      brand: null,
      imageUrl: null,
      productSizeGrams: null,
      kcalPer100g: 123,
      proteinPer100g: null,
      fatPer100g: null,
      carbsPer100g: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/api/v2/product/654.json');
  });

  it('normalizes an invalid image URL to null', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        product: {
          product_name: 'Broken image',
          image_url: 'not a URL',
          nutriments: {
            'energy-kcal_100g': 20,
          },
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getOpenFoodFactsProduct('321')).resolves.toEqual({
      barcode: '321',
      name: 'Broken image',
      brand: null,
      imageUrl: null,
      productSizeGrams: null,
      kcalPer100g: 20,
      proteinPer100g: null,
      fatPer100g: null,
      carbsPer100g: null,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
