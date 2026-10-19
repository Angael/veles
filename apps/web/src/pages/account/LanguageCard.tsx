import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card/Card';
import { formatDate, formatNumber } from '@/lib/i18n/format';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { LOCALE_COOKIE, LOCALE_NAMES, LOCALES, type Locale } from '@/lib/i18n/locale';
import css from './AccountPage.module.css';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
/** Fixed sample, so the server and the browser render the same preview. */
const SAMPLE_DATE = '2026-12-31';
const SAMPLE_NUMBER = 1234.5;

/** Saves the language in a cookie and reloads, so server-rendered text and cached data match it. */
function saveLocale(locale: Locale) {
  const secureAttribute = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LOCALE_COOKIE}=${locale}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secureAttribute}`;
  location.reload();
}

function formatSample(locale: Locale) {
  const date = formatDate(locale, SAMPLE_DATE, { day: '2-digit', month: '2-digit' });
  return `${date} · ${formatNumber(locale, SAMPLE_NUMBER)}`;
}

export function LanguageCard() {
  const { locale, t } = useI18n();
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);
  const selectedLocale = pendingLocale ?? locale;

  return (
    <Card aria-busy={pendingLocale !== null} as='section' data-appear='1'>
      <header className={css.sectionHeader}>
        <div>
          <h2 id='language-heading'>{t({ en: 'Language', pl: 'Język' })}</h2>
          <p>
            {t({
              en: 'Also sets date and number formats.',
              pl: 'Ustawia też format dat i liczb.',
            })}
          </p>
        </div>
      </header>
      <div aria-labelledby='language-heading' className={css.languageOptions} role='radiogroup'>
        {LOCALES.map((option) => (
          <label className={css.languageOption} key={option}>
            <input
              checked={selectedLocale === option}
              className={css.languageRadio}
              disabled={pendingLocale !== null}
              lang={option}
              name='locale'
              onChange={() => {
                if (option === locale) return;
                setPendingLocale(option);
                saveLocale(option);
              }}
              type='radio'
              value={option}
            />
            <span aria-hidden='true' className={css.languageCode}>
              {option}
            </span>
            <span className={css.languageText}>
              <strong lang={option}>{LOCALE_NAMES[option]}</strong>
              <small>{formatSample(option)}</small>
            </span>
            <CheckIcon aria-hidden='true' className={css.languageCheck} />
          </label>
        ))}
      </div>
    </Card>
  );
}
