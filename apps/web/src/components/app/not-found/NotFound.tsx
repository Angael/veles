import { Link } from '@tanstack/react-router';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function NotFound() {
  const { t } = useI18n();

  return (
    <main style={{ padding: 'var(--space-xl)', fontFamily: 'var(--font-sans)' }}>
      <h1>{t({ en: 'Page not found', pl: 'Nie znaleziono strony' })}</h1>
      <Link to='/'>{t({ en: 'Back home', pl: 'Wróć na stronę główną' })}</Link>
    </main>
  );
}
