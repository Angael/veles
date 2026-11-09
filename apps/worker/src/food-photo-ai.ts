export type AiConfig = {
  apiKey: string;
  /** OpenAI-compatible base URL, e.g. `https://openrouter.ai/api/v1`. */
  baseUrl: string;
  model: string;
};

export type FoodPhotoImage = { dataUrl: string; role: 'front' | 'label' };

export type FoodPhotoResult = {
  name: string;
  productSizeGrams: number | null;
  kcalPer100g: number;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbsPer100g: number | null;
};

/** Thrown when retrying the same photos cannot help, e.g. the photo shows no food. */
export class FoodPhotoRejectedError extends Error {}

const requestTimeoutMs = 90_000;

const systemPrompt = `You read food photos for a calorie diary.
You get a FRONT photo and optionally a LABEL photo (nutrition table).
Return ONLY one JSON object:
{"food": true, "name": string, "productSizeGrams": number|null, "kcalPer100g": number, "proteinPer100g": number|null, "fatPer100g": number|null, "carbsPer100g": number|null}
Rules:
- Values are per 100 g (or 100 ml). If the label only shows per serving, convert to per 100 g.
- If kJ and kcal are both shown, use kcal. Never return kJ.
- "name": short product name with brand, in the language printed on the package. For unpackaged food use a plain name, e.g. "Banana".
- "productSizeGrams": net weight of the whole package, or null if unknown.
- Without a label photo, use typical values for this food (search the web when available).
- If the photos show no food, return {"food": false, "reason": string}.`;

/** Sends the photos to an OpenAI-compatible chat API and validates the JSON answer. */
export async function analyzeFoodPhotos(
  config: AiConfig,
  images: FoodPhotoImage[],
  signal: AbortSignal,
): Promise<FoodPhotoResult> {
  const hasLabel = images.some((image) => image.role === 'label');
  const content = [
    { type: 'text', text: hasLabel ? 'FRONT photo, then LABEL photo.' : 'FRONT photo only.' },
    ...images.map((image) => ({ type: 'image_url', image_url: { url: image.dataUrl } })),
  ];

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
      // OpenRouter web search; only for unlabeled food, where the model must look values up.
      ...(hasLabel ? {} : { plugins: [{ id: 'web', max_results: 3 }] }),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
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
  return parseFoodPhotoAnswer(body.choices?.[0]?.message?.content ?? '');
}

/** Accepts JSON wrapped in prose or code fences, because not every model honors JSON mode. */
export function parseFoodPhotoAnswer(text: string): FoodPhotoResult {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('AI answer has no JSON object');

  const raw: unknown = JSON.parse(text.slice(start, end + 1));
  if (typeof raw !== 'object' || raw === null) throw new Error('AI answer is not an object');
  const data = raw as Record<string, unknown>;

  if (data.food === false) {
    throw new FoodPhotoRejectedError(
      typeof data.reason === 'string' ? data.reason : 'No food found on the photos',
    );
  }

  const name = typeof data.name === 'string' ? data.name.trim().slice(0, 200) : '';
  const kcalPer100g = amount(data.kcalPer100g);
  if (!name || kcalPer100g === null) throw new Error('AI answer misses name or kcal');

  return {
    name,
    productSizeGrams: positiveOrNull(amount(data.productSizeGrams)),
    kcalPer100g,
    proteinPer100g: amount(data.proteinPer100g),
    fatPer100g: amount(data.fatPer100g),
    carbsPer100g: amount(data.carbsPer100g),
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
