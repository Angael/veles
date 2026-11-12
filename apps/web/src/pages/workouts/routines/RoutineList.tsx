import { useSuspenseQuery } from '@tanstack/react-query';
import { ChevronDownIcon } from 'lucide-react';
import { RoutineCard } from './RoutineCard';
import { routinesQueryOptions } from './routines.query';
import css from './Routines.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/**
 * Routines as a grid of cards, each opening its page. Archived routines sit in a collapsed section
 * below, shown only when there are any. Starting one straight away lives in the floating button.
 */
export function RoutineList() {
  const { t } = useI18n();
  const { data: routines } = useSuspenseQuery(routinesQueryOptions());
  const active = routines.filter((routine) => !routine.archived);
  const archived = routines.filter((routine) => routine.archived);

  return (
    <section aria-labelledby='routines-title' className={css.panel} data-appear='3'>
      <h2 id='routines-title'>{t({ en: 'Routines', pl: 'Plany' })}</h2>
      {active.length === 0 ? (
        <p className={css.hint}>
          {archived.length > 0
            ? t({
                en: 'All routines are archived. Restore one from the list below.',
                pl: 'Wszystkie plany są zarchiwizowane. Przywróć plan z listy poniżej.',
              })
            : t({
                en: 'Finish a workout you like, then use its ⋯ menu to save it as a routine.',
                pl: 'Zakończ trening, który Ci odpowiada, a potem zapisz go jako plan w menu ⋯.',
              })}
        </p>
      ) : (
        <ul className={css.grid}>
          {active.map((routine) => (
            <li key={routine.id}>
              <RoutineCard routine={routine} />
            </li>
          ))}
        </ul>
      )}
      {archived.length > 0 ? (
        <details className={css.archived}>
          <summary>
            {t({
              en: `Archived routines (${archived.length})`,
              pl: `Zarchiwizowane plany (${archived.length})`,
            })}
            <ChevronDownIcon aria-hidden='true' />
          </summary>
          <ul className={css.grid}>
            {archived.map((routine) => (
              <li key={routine.id}>
                <RoutineCard routine={routine} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
