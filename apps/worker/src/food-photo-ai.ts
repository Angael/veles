import { type FoodProductUnit, foodProductUnits } from '@veles/db/seed/food-products';

export type AiConfig = {
  apiKey: string;
  /** OpenAI-compatible base URL, e.g. `https://openrouter.ai/api/v1`. */
  baseUrl: string;
  model: string;
};

export type FoodPhotoImage = { dataUrl: string };

type Nutrition = {
  kcalPer100g: number;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbsPer100g: number | null;
};

export type FoodPhotoResult = Nutrition & {
  name: string;
  unit: FoodProductUnit;
  /** Weight of one unit, e.g. the net weight of the package. */
  productSizeGrams: number | null;
  /** Index of the photo that best shows the product. */
  coverPhotoIndex: number;
};

/** Thrown when retrying the same photos cannot help, e.g. the photo shows no food. */
export class FoodPhotoRejectedError extends Error {}

const requestTimeoutMs = 90_000;

const photosPrompt = `You read photos of one food product for a calorie diary.
The photos come in any order. They can show the front, the back, the nutrition table, the ingredients, or food without a package. Combine what you can read from all of them.
Return ONLY one JSON object:
{"food": true, "name": string, "unit": "package"|"piece"|"slice"|"serving", "unitGrams": number|null, "coverPhoto": number, "nutritionTableVisible": boolean, "kcalPer100g": number|null, "proteinPer100g": number|null, "fatPer100g": number|null, "carbsPer100g": number|null}
Rules:
- Nutrition values are per 100 g (or 100 ml). If the label only shows per serving, convert to per 100 g.
- If kJ and kcal are both shown, use kcal. Never return kJ.
- "nutritionTableVisible": true only if a nutrition table is readable. If false, return null for all nutrition values. Do not guess them.
- "name": short product name with brand, in the language printed on the package. For food without a package use a plain name in Polish, e.g. "Banan".
- "unit": what one portion of this product is. Use "package" for packaged products, "piece" for single items such as a fruit or an egg, "slice" for sliced food, "serving" otherwise.
- "unitGrams": weight of one unit. For "package" use the printed net weight of the whole package. For food without a package use a typical weight of one item. Use null if unknown.
- "coverPhoto": number of the photo, starting at 1, that best shows what the product looks like.
- If the photos show no food, return {"food": false, "reason": string}.`;

const lookupPrompt = `You look up typical nutrition values of a food for a calorie diary. Use web search.
Return ONLY one JSON object:
{"kcalPer100g": number, "proteinPer100g": number|null, "fatPer100g": number|null, "carbsPer100g": number|null}
Values are per 100 g (or 100 ml). Never return kJ.`;

type ChatMessage = { role: 'system' | 'user'; content: unknown };

/** Sends one request to an OpenAI-compatible chat API and returns the answer text. */
async function chat(
  config: AiConfig,
  request: { messages: ChatMessage[]; webSearch?: boolean },
  signal: AbortSignal,
) {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'Veles',
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      max_tokens: 400,
      response_format: { type: 'json_object' },
      ...(request.webSearch ? { plugins: [{ id: 'web', max_results: 3 }] } : {}),
      messages: request.messages,
    }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(requestTimeoutMs)]),
  });

  if (!response.ok) {
    throw new Error(
      `AI request failed: ${response.status} ${(await response.text()).slice(0, 300)}`,
    );
  }

  const body = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  return body.choices?.[0]?.message?.content ?? '';
}

/**
 * Reads everything it can from the photos. Web search is a paid extra, so a second text-only
 * request uses it only when the photos have no readable nutrition table, e.g. for a banana.
 */
export async function analyzeFoodPhotos(
  config: AiConfig,
  images: FoodPhotoImage[],
  signal: AbortSignal,
): Promise<FoodPhotoResult> {
  const answer = await chat(
    config,
    {
      messages: [
        { role: 'system', content: photosPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: `${images.length} photo(s) of one product.` },
            ...images.map((image) => ({ type: 'image_url', image_url: { url: image.dataUrl } })),
          ],
        },
      ],
    },
    signal,
  );
  const { nutrition, ...product } = parsePhotoAnswer(answer, images.length);
  if (nutrition) return { ...product, ...nutrition };

  const lookupAnswer = await chat(
    config,
    {
      messages: [
        { role: 'system', content: lookupPrompt },
        { role: 'user', content: `Food: ${product.name}` },
      ],
      webSearch: true,
    },
    signal,
  );
  const lookedUp = parseNutrition(parseJsonObject(lookupAnswer));
  if (!lookedUp) throw new Error('AI answer misses kcal');
  return { ...product, ...lookedUp };
}

/** Accepts JSON wrapped in prose or code fences, because not every model honors JSON mode. */
function parseJsonObject(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('AI answer has no JSON object');

  const raw: unknown = JSON.parse(text.slice(start, end + 1));
  if (typeof raw !== 'object' || raw === null) throw new Error('AI answer is not an object');
  return raw as Record<string, unknown>;
}

function parseNutrition(data: Record<string, unknown>): Nutrition | null {
  const kcalPer100g = amount(data.kcalPer100g);
  if (kcalPer100g === null) return null;
  return {
    kcalPer100g,
    proteinPer100g: amount(data.proteinPer100g),
    fatPer100g: amount(data.fatPer100g),
    carbsPer100g: amount(data.carbsPer100g),
  };
}

function parseUnit(value: unknown): FoodProductUnit {
  return foodProductUnits.find((unit) => unit === value) ?? 'package';
}

function parseCoverPhotoIndex(value: unknown, photoCount: number) {
  const number = amount(value);
  return number !== null && Number.isInteger(number) && number >= 1 && number <= photoCount
    ? number - 1
    : 0;
}

/** Validates the photo answer; `nutrition` is null when it must be looked up instead. */
function parsePhotoAnswer(text: string, photoCount: number) {
  const data = parseJsonObject(text);

  if (data.food === false) {
    throw new FoodPhotoRejectedError(
      typeof data.reason === 'string' ? data.reason : 'No food found on the photos',
    );
  }

  const name = typeof data.name === 'string' ? data.name.trim().slice(0, 200) : '';
  if (!name) throw new Error('AI answer misses the name');

  return {
    name,
    unit: parseUnit(data.unit),
    productSizeGrams: positiveOrNull(amount(data.unitGrams)),
    coverPhotoIndex: parseCoverPhotoIndex(data.coverPhoto, photoCount),
    nutrition: data.nutritionTableVisible === false ? null : parseNutrition(data),
  };
}

function amount(value: unknown) {
  const number = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof number !== 'number' || !Number.isFinite(number) || number < 0 || number > 100_000) {
    return null;
  }
  return Math.round(number * 100) / 100;
}

function positiveOrNull(value: number | null) {
  return value !== null && value > 0 ? value : null;
}
