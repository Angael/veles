import { createIsomorphicFn } from '@tanstack/react-start';
import { getCookie, getRequestHeader } from '@tanstack/react-start/server';
import { isLocale, LOCALE_COOKIE, negotiateLocale, type Locale, type Localized } from './locale';

/**
 * Reads the active locale outside React. The server uses the locale cookie, then the browser's
 * `Accept-Language`; the browser reads the `<html lang>` that the server rendered.
 */
export const getLocale = createIsomorphicFn()
  .server((): Locale => {
    const cookie = getCookie(LOCALE_COOKIE);

    return isLocale(cookie) ? cookie : negotiateLocale(getRequestHeader('accept-language'));
  })
  .client((): Locale => {
    const lang = document.documentElement.lang;

    return isLocale(lang) ? lang : negotiateLocale(navigator.languages.join(','));
  });

/** Picks the active locale's variant outside React, e.g. in server errors and mutation toasts. */
export function translate<T>(text: Localized<T>): T {
  return text[getLocale()];
}
