import { PlusIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { DialogPopup, DialogRoot, DialogTitle } from '@/components/ui/dialog/Dialog';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { MOCK_EXERCISES, type Measure, type MockExercise } from '../mockData';
import { fuzzySearch, normalize } from './fuzzySearch';
import { MeasurePicker } from './MeasurePicker';
import css from './Library.module.css';

/**
 * Guesses what to track from a user's own name, so creating "Morning plank" needs zero extra taps.
 * The guess is only a default chip; the user can flip it before adding.
 */
export function guessMeasure(name: string): Measure {
  const lower = name.toLowerCase();
  if (/run|bike|cycl|row(ing|er)|swim|walk(?!.*farmer)|km/.test(lower)) return 'distance_duration';
  if (/farmer|carry|weighted (hang|hold|plank)/.test(lower)) return 'weight_duration';
  if (/plank|hold|hang|stretch|wall sit|l-sit/.test(lower)) return 'duration';
  if (/push-?up|pull-?up|chin-?up|dip|burpee|sit-?up|crunch/.test(lower) && !/machine/.test(lower))
    return 'reps';
  return 'weight_reps';
}

type ExercisePickerProps = {
  onPick: (exercise: Pick<MockExercise, 'measure' | 'name'>) => void;
};

/**
 * Search over the user's own exercises only. When nothing matches, the query itself becomes the
 * new exercise name; there is no global catalog to fight with.
 */
export function ExercisePicker({ onPick }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const [measureOverride, setMeasureOverride] = useState<Measure | null>(null);
  const measure = measureOverride ?? guessMeasure(trimmed);

  const matches = fuzzySearch(
    trimmed,
    MOCK_EXERCISES,
    (exercise) => exercise.name,
    (exercise) => exercise.uses,
  );
  const exactMatch = matches.some((exercise) => normalize(exercise.name) === normalize(trimmed));
  const create =
    trimmed && !exactMatch ? (
      <div className={css.create}>
        <button
          className={css.createButton}
          onClick={() => onPick({ measure, name: trimmed })}
          type='button'
        >
          <PlusIcon aria-hidden='true' />
          <span>
            Create <strong>“{trimmed}”</strong>
          </span>
        </button>
        <MeasurePicker onChange={setMeasureOverride} value={measure} />
      </div>
    ) : null;

  return (
    <div className={css.picker}>
      <TextInput
        aria-label='Search or name a new exercise'
        autoFocus
        onChange={(event) => {
          setQuery(event.target.value);
          setMeasureOverride(null);
        }}
        placeholder='Search or type a new name'
        trailing={<SearchIcon aria-hidden='true' className={css.searchIcon} />}
        value={query}
      />

      {matches.length === 0 ? create : null}

      <ul className={css.results}>
        {matches.map((exercise) => (
          <li key={exercise.id}>
            <button className={css.result} onClick={() => onPick(exercise)} type='button'>
              <span className={css.resultName}>{exercise.name}</span>
              <span className={css.resultMeta}>
                {exercise.lastBest} · {exercise.lastDone}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {/* Typos still list close matches first; creating a near-duplicate is the last option. */}
      {matches.length > 0 ? create : null}
    </div>
  );
}

type ExercisePickerDialogProps = ExercisePickerProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ExercisePickerDialog({ onOpenChange, onPick, open }: ExercisePickerDialogProps) {
  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup className={css.pickerDialog}>
        <DialogTitle>Add exercise</DialogTitle>
        <ExercisePicker onPick={onPick} />
      </DialogPopup>
    </DialogRoot>
  );
}
