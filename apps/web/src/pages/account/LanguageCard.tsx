import clsx from 'clsx';
import { Card } from '@/components/ui/card/Card';
import { SelectInput } from '@/components/ui/select-input/SelectInput';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { LOCALE_COOKIE, LOCALE_NAMES, LOCALES, type Locale } from '@/lib/i18n/locale';
import css from './AccountPage.module.css';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const languageItems = LOCALES.map((locale) => ({ label: LOCALE_NAMES[locale], value: locale }));

/** Saves the language in a cookie and reloads, so server-rendered text and cached data match it. */
function saveLocale(locale: Locale) {
  const secureAttribute = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LOCALE_COOKIE}=${locale}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secureAttribute}`;
  location.reload();
}

export function LanguageCard() {
  const { locale, t } = useI18n();

  return (
    <Card as='section' data-appear='1'>
      <header className={clsx(css.sectionHeader, css.languageHeader)}>
        <div>
          <h2>{t({ en: 'Language', pl: 'Język' })}</h2>
          <p>
            {t({
              en: 'Also sets date and number formats.',
              pl: 'Ustawia też format dat i liczb.',
            })}
          </p>
        </div>
        <SelectInput
          aria-label={t({ en: 'Language', pl: 'Język' })}
          items={languageItems}
          onValueChange={(value) => {
            if (value && value !== locale) saveLocale(value);
          }}
          value={locale}
        />
      </header>
    </Card>
  );
}
