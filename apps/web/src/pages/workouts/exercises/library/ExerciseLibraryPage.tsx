import { useSuspenseQuery } from '@tanstack/react-query';
import { ChevronRightIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card/Card';
import { List, ListItem } from '@/components/ui/list/List';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { MEASURE_LABELS, SHORT_DAY } from '../../metrics';
import type { ExerciseLibraryEntry } from '../exercises.server';
import { exerciseLibraryQueryOptions } from '../exercises.query';
import { normalize } from '../fuzzySearch';
import { ExerciseDialog } from './ExerciseDialog';
import css from './ExerciseLibrary.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/**
 * Every exercise the user created: search, open one to rename it, change what it tracks or its
 * rest timer, see its history, and archive or restore it. Archived ones sit in their own section.
 */
export function ExerciseLibraryPage() {
  const { t } = useI18n();
  const { data: exercises } = useSuspenseQuery(exerciseLibraryQueryOptions());
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = exercises.find((exercise) => exercise.id === editingId);

  const needle = normalize(query);
  const shown = needle
    ? exercises.filter((exercise) => normalize(exercise.name).includes(needle))
    : exercises;
  const active = shown.filter((exercise) => !exercise.archived);
  const archived = shown.filter((exercise) => exercise.archived);

  if (exercises.length === 0) {
    return (
      <main className={css.page}>
        <Card as='section' className={css.empty}>
          <h1>{t({ en: 'No exercises yet', pl: 'Brak ćwiczeń' })}</h1>
          <p>
            {t({
              en: 'Exercises you add to a workout show up here.',
              pl: 'Ćwiczenia dodane do treningu pojawią się tutaj.',
            })}
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className={css.page}>
      <TextInput
        aria-label={t({ en: 'Search exercises', pl: 'Szukaj ćwiczeń' })}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t({ en: 'Search exercises', pl: 'Szukaj ćwiczeń' })}
        trailing={<SearchIcon aria-hidden='true' className={css.searchIcon} />}
        type='search'
        value={query}
      />
      {active.length > 0 ? (
        <ExerciseRows exercises={active} onOpen={setEditingId} />
      ) : (
        <p className={css.hint}>
          {t({ en: 'No matching exercises.', pl: 'Brak pasujących ćwiczeń.' })}
        </p>
      )}
      {archived.length > 0 ? (
        <details className={css.archived} open={needle !== '' || undefined}>
          <summary>
            {t({ en: `Archived (${archived.length})`, pl: `Zarchiwizowane (${archived.length})` })}
          </summary>
          <ExerciseRows exercises={archived} onOpen={setEditingId} />
        </details>
      ) : null}
      {editing ? (
        <ExerciseDialog exercise={editing} key={editing.id} onClose={() => setEditingId(null)} />
      ) : null}
    </main>
  );
}

function ExerciseRows({
  exercises,
  onOpen,
}: {
  exercises: ExerciseLibraryEntry[];
  onOpen: (id: string) => void;
}) {
  const { formatDate, t } = useI18n();

  return (
    <List>
      {exercises.map((exercise) => (
        <ListItem className={css.item} interactive key={exercise.id}>
          <button className={css.row} onClick={() => onOpen(exercise.id)} type='button'>
            <span className={css.identity}>
              <strong>{exercise.name}</strong>
              <span>
                {t(MEASURE_LABELS[exercise.measure])}
                {' · '}
                {exercise.lastDate
                  ? t({
                      en: `${exercise.sessionCount}× · last ${formatDate(exercise.lastDate, SHORT_DAY)}`,
                      pl: `${exercise.sessionCount}× · ostatnio ${formatDate(exercise.lastDate, SHORT_DAY)}`,
                    })
                  : t({ en: 'Not done yet', pl: 'Jeszcze nie wykonane' })}
              </span>
            </span>
            <ChevronRightIcon aria-hidden='true' />
          </button>
        </ListItem>
      ))}
    </List>
  );
}
