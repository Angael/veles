import { createContext, use, type ReactNode } from 'react';
import { dateFnsLocale, formatDate, formatNumber } from './format';
import { DEFAULT_LOCALE, type Locale, type Localized } from './locale';

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function I18nProvider({ children, locale }: { children: ReactNode; locale: Locale }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

/**
 * Active locale with helpers bound to it. Write text inline at the call site:
 * `t({ en: 'Save', pl: 'Zapisz' })`.
 */
export function useI18n() {
  const locale = use(LocaleContext);

  return {
    locale,
    t: <T,>(text: Localized<T>): T => text[locale],
    dateLocale: dateFnsLocale(locale),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(locale, value, options),
    /** Rounds first: kcal, macros, and food grams show as whole numbers. */
    formatWhole: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(locale, Math.round(value), options),
    formatDate: (value: Date | string, options: Intl.DateTimeFormatOptions) =>
      formatDate(locale, value, options),
  };
}

/** The `useI18n()` result, for helpers that format text outside the component body. */
export type I18n = ReturnType<typeof useI18n>;
