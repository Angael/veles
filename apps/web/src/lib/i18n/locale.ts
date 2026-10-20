export const LOCALES = ['en', 'pl'] as const;

export type Locale = (typeof LOCALES)[number];

/** Text, or any other value, written once per supported locale. */
export type Localized<T = string> = Record<Locale, T>;

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'veles-locale';
export const LOCALE_NAMES: Localized = { en: 'English', pl: 'Polski' };

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

/** Picks the first supported language from an `Accept-Language` header, in the order the browser prefers. */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  const preferred = (acceptLanguage ?? '')
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const quality = params.find((param) => param.trim().startsWith('q='));

      return {
        language: tag.trim().toLowerCase().split('-')[0],
        quality: quality ? Number(quality.trim().slice(2)) : 1,
      };
    })
    .filter((entry) => entry.quality > 0)
    .toSorted((a, b) => b.quality - a.quality);

  for (const { language } of preferred) {
    if (isLocale(language)) return language;
  }

  return DEFAULT_LOCALE;
}

/** English plural: `pluralEn(2, 'entry', 'entries')` -> `entries`. */
export function pluralEn(count: number, one: string, other: string) {
  return count === 1 ? one : other;
}

/**
 * Polish plural: `pluralPl(n, 'wpis', 'wpisy', 'wpisów')`.
 * `few` covers 2-4, 22-24, …; `many` covers 0, 5-21, 25-31, …; fractions use `few`.
 */
export function pluralPl(count: number, one: string, few: string, many: string) {
  const category = new Intl.PluralRules('pl').select(count);
  if (category === 'one') return one;
  if (category === 'many') return many;
  return few;
}
