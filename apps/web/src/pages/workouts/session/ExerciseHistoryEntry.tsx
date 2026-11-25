import clsx from 'clsx';
import { Fragment } from 'react';
import type { ExerciseHistoryEntry as Entry } from '../exercises/exercises.api';
import {
  formatMetric,
  type Measure,
  type MetricKey,
  SET_BADGE,
  SET_TYPE_LABELS,
  type SetMetrics,
  setValues,
  SHORT_DAY,
  workingSetNumbers,
} from '../metrics';
import { ClampedText } from './ClampedText';
import css from './ExerciseHistory.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Localized } from '@/lib/i18n/locale';

/** Spelled out, not a bare dash: "no weight × 12 reps" can't be misread as a zero or a typo. */
const NOT_LOGGED: Record<MetricKey, Localized> = {
  distanceKm: { en: 'no distance', pl: 'bez dystansu' },
  durationSeconds: { en: 'no time', pl: 'bez czasu' },
  reps: { en: 'no reps', pl: 'bez powt.' },
  weightKg: { en: 'no weight', pl: 'bez ciężaru' },
};

/** Time cells show `1:30`; the history spells out the unit as well. */
const TIME_UNIT: Localized = { en: 'min', pl: 'min' };

/**
 * One past session: date and the workout's name with where the exercise sat in it ("#1 of 5"
 * often explains a good or bad day), then a row per set and the note.
 */
export function ExerciseHistoryEntry({ entry, measure }: { entry: Entry; measure: Measure }) {
  const { formatDate, t } = useI18n();
  const numbers = workingSetNumbers(entry.sets);

  return (
    <li className={css.entry}>
      <header className={css.header}>
        <time className={css.date} dateTime={entry.date}>
          {formatDate(entry.date, SHORT_DAY)}
        </time>
        <span className={css.position}>
          <span aria-hidden='true'>
            {t({
              en: `#${entry.position} of ${entry.exerciseCount}`,
              pl: `#${entry.position} z ${entry.exerciseCount}`,
            })}
          </span>
          <span className={css.srOnly}>
            {t({
              en: `Exercise ${entry.position} of ${entry.exerciseCount} in that workout`,
              pl: `Ćwiczenie ${entry.position} z ${entry.exerciseCount} w tym treningu`,
            })}
          </span>
        </span>
        <ClampedText
          className={css.workout}
          clampClassName={css.clampWorkout}
          label={{ en: 'Workout name', pl: 'Nazwa treningu' }}
          text={entry.workoutName}
        />
      </header>
      {entry.sets.length > 0 ? (
        <ol className={css.sets}>
          {entry.sets.map((set, index) => {
            const label =
              set.type === 'normal'
                ? t({ en: `Set ${numbers[index]}`, pl: `Seria ${numbers[index]}` })
                : t(SET_TYPE_LABELS[set.type]);
            return (
              <li className={clsx(css.set, set.type === 'warmup' && css.warmup)} key={set.id}>
                <span aria-hidden='true' className={css.badge} data-type={set.type}>
                  {set.type === 'normal' ? numbers[index] : t(SET_BADGE[set.type])}
                </span>
                <span className={css.srOnly}>{`${label}: `}</span>
                <SetValues measure={measure} set={set} />
              </li>
            );
          })}
        </ol>
      ) : (
        <p className={css.none}>{t({ en: 'No sets done', pl: 'Brak wykonanych serii' })}</p>
      )}
      {entry.note ? (
        <div className={css.note}>
          <ClampedText
            clampClassName={css.clampNote}
            label={{ en: 'Note', pl: 'Notatka' }}
            text={entry.note}
          />
        </div>
      ) : null}
    </li>
  );
}

/** `35 kg × 20 reps`, `5.2 km · 28:10 min`, `no weight · 12 reps`. */
function SetValues({ measure, set }: { measure: Measure; set: SetMetrics }) {
  const { locale, t } = useI18n();
  const values = setValues(set, measure);

  return (
    <span className={css.values}>
      {values.map(({ field, value }, index) => {
        const previous = values[index - 1];
        const times = previous?.field.key === 'weightKg' && field.key === 'reps';
        const bothLogged = previous?.value !== null && value !== null;
        return (
          <Fragment key={field.key}>
            {index > 0 && times && bothLogged ? <span className={css.separator}>×</span> : null}
            {index > 0 && !(times && bothLogged) ? (
              <span aria-hidden='true' className={css.separator}>
                ·
              </span>
            ) : null}
            {value === null ? (
              <span className={css.missing}>{t(NOT_LOGGED[field.key])}</span>
            ) : (
              <span>
                <strong>{formatMetric(field, value, locale)}</strong>{' '}
                {t(field.cellUnit ?? TIME_UNIT)}
              </span>
            )}
          </Fragment>
        );
      })}
    </span>
  );
}
