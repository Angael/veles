import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { DialogPopup, DialogRoot, DialogTitle } from '@/components/ui/dialog/Dialog';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { MEASURE_LABELS, MEASURES, SHORT_DAY, type Measure } from '../metrics';
import { exercisesQueryOptions } from './exercises.query';
import { fuzzySearch, normalize } from './fuzzySearch';
import { guessMeasure } from './guessMeasure';
import { MeasurePicker } from './MeasurePicker';
import css from './ExercisePicker.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export type ExercisePick =
  | { exerciseId: string }
  | { newExercise: { name: string; measure: Measure } };

/**
 * Search over the user's own exercises only. When nothing matches exactly, the query becomes a
 * new exercise: clicking a tracking type creates it at once. Keyboard: ↑/↓ move through the
 * options, ←/→ change the tracking type on the Create row, Enter picks.
 */
function ExercisePicker({ onPick }: { onPick: (pick: ExercisePick) => void }) {
  const { formatDate, t } = useI18n();
  const exercises = useQuery(exercisesQueryOptions());
  const listId = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [measureOverride, setMeasureOverride] = useState<Measure | null>(null);
  const trimmed = query.trim();
  const measure = measureOverride ?? guessMeasure(trimmed);

  const matches = fuzzySearch(
    trimmed,
    exercises.data ?? [],
    (exercise) => exercise.name,
    (exercise) => exercise.uses,
  );
  const canCreate =
    trimmed !== '' && !matches.some((exercise) => normalize(exercise.name) === normalize(trimmed));
  // Close matches first; creating a near-duplicate is the last option.
  const createIndex = canCreate ? matches.length : -1;
  const optionCount = matches.length + (canCreate ? 1 : 0);
  const optionId = (index: number) => `${listId}-${index}`;
  const create = (picked: Measure) => onPick({ newExercise: { measure: picked, name: trimmed } });

  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  });

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const step = (delta: number) => {
      event.preventDefault();
      setActive((current) => (current + delta + optionCount) % optionCount);
    };
    if (optionCount === 0) return;
    if (event.key === 'ArrowDown') step(1);
    if (event.key === 'ArrowUp') step(-1);
    if (active === createIndex && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const next = (MEASURES.indexOf(measure) + delta + MEASURES.length) % MEASURES.length;
      setMeasureOverride(MEASURES[next] ?? measure);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const match = matches[active];
      if (match) onPick({ exerciseId: match.id });
      else if (active === createIndex) create(measure);
    }
  }

  return (
    <div className={css.picker}>
      <TextInput
        aria-activedescendant={optionCount > 0 ? optionId(active) : undefined}
        aria-autocomplete='list'
        aria-controls={listId}
        aria-expanded={optionCount > 0}
        aria-label={t({
          en: 'Search or name a new exercise',
          pl: 'Szukaj lub nazwij nowe ćwiczenie',
        })}
        autoFocus
        onChange={(event) => {
          setQuery(event.target.value);
          setMeasureOverride(null);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        placeholder={t({ en: 'Search or type a new name', pl: 'Szukaj lub wpisz nową nazwę' })}
        role='combobox'
        trailing={<SearchIcon aria-hidden='true' className={css.searchIcon} />}
        value={query}
      />

      {exercises.isSuccess && exercises.data.length === 0 && !trimmed ? (
        <p className={css.hint}>
          {t({
            en: 'Type a name to create your first exercise.',
            pl: 'Wpisz nazwę, aby utworzyć pierwsze ćwiczenie.',
          })}
        </p>
      ) : null}

      <ul className={css.results} id={listId} role='listbox'>
        {matches.map((exercise, index) => (
          <li
            aria-selected={index === active}
            className={clsx(css.result, index === active && css.active)}
            id={optionId(index)}
            key={exercise.id}
            onClick={() => onPick({ exerciseId: exercise.id })}
            onPointerMove={() => setActive(index)}
            role='option'
          >
            <span className={css.resultName}>{exercise.name}</span>
            <span className={css.resultMeta}>
              {t(MEASURE_LABELS[exercise.measure])}
              {exercise.lastDate ? ` · ${formatDate(exercise.lastDate, SHORT_DAY)}` : ''}
            </span>
          </li>
        ))}
        {canCreate ? (
          <li
            aria-selected={active === createIndex}
            className={clsx(css.create, active === createIndex && css.active)}
            id={optionId(createIndex)}
            role='option'
          >
            <span className={css.createLabel}>
              <PlusIcon aria-hidden='true' />
              <span>
                {t({ en: 'Create', pl: 'Utwórz' })}{' '}
                <strong>{t({ en: `“${trimmed}”`, pl: `„${trimmed}”` })}</strong>{' '}
                {t({ en: 'as:', pl: 'jako:' })}
              </span>
            </span>
            <MeasurePicker
              actionLabel={(label) =>
                t({
                  en: `Create “${trimmed}” as ${label}`,
                  pl: `Utwórz „${trimmed}” jako ${label}`,
                })
              }
              onChange={create}
              value={measure}
            />
          </li>
        ) : null}
      </ul>
    </div>
  );
}

type ExercisePickerDialogProps = {
  onPick: (pick: ExercisePick) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ExercisePickerDialog({ onOpenChange, onPick, open }: ExercisePickerDialogProps) {
  const { t } = useI18n();

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup className={css.pickerDialog}>
        <DialogTitle>{t({ en: 'Add exercise', pl: 'Dodaj ćwiczenie' })}</DialogTitle>
        {open ? <ExercisePicker onPick={onPick} /> : null}
      </DialogPopup>
    </DialogRoot>
  );
}
