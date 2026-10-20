import { useLiveQuery } from '@tanstack/react-db';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useThrottledValue } from '@tanstack/react-pacer';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card/Card';
import { SelectInput } from '@/components/ui/select-input/SelectInput';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { filterAndRankBySearch, type RankedSearchFields } from '@/lib/search/filterAndRankBySearch';
import { CheckedNoteCard } from './CheckedNoteCard';
import { listItemsCollection } from './listItems.collection';
import type { NoteSummary } from './notes.api';
import { NoteComposer } from './NoteComposer';
import { notesQueryOptions } from './notes.query';
import { TextNoteCard } from './TextNoteCard';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

const noteScopeItems = [
  { label: { en: 'All notes', pl: 'Wszystkie notatki' }, value: 'all' },
  { label: { en: 'Your notes', pl: 'Twoje notatki' }, value: 'owned' },
] as const;

type SearchableNote = NoteSummary & { itemNames: string[] };

const noteSearchFields = [
  (note) => note.title,
  (note) => note.content,
  (note) => note.itemNames,
] satisfies RankedSearchFields<SearchableNote>;

export function TodosPage() {
  const { t } = useI18n();
  const { data: notes, refetch: refetchNotes } = useSuspenseQuery(notesQueryOptions());
  const [noteScope, setNoteScope] = useState<'all' | 'owned'>('all');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [search] = useThrottledValue(searchInputValue, { wait: 200 });
  // Same collection the cards write to, so search sees renamed or added items immediately.
  const { data: items } = useLiveQuery({ query: (q) => q.from({ item: listItemsCollection }) });
  const searchableNotes = useMemo(
    () =>
      notes.map((note) => ({
        ...note,
        itemNames: items.filter((item) => item.noteId === note.id).map((item) => item.name),
      })),
    [items, notes],
  );
  const scopedNotes =
    noteScope === 'owned' ? searchableNotes.filter((note) => note.isOwned) : searchableNotes;
  const visibleNotes = filterAndRankBySearch(scopedNotes, search, noteSearchFields);

  return (
    <main className={css.page}>
      <section
        aria-label={t({ en: 'Filter notes', pl: 'Filtruj notatki' })}
        className={css.controls}
        data-appear
      >
        <TextInput
          aria-label={t({ en: 'Search notes', pl: 'Szukaj notatek' })}
          autoComplete='off'
          name='search'
          onValueChange={setSearchInputValue}
          placeholder={t({ en: 'Search notes', pl: 'Szukaj notatek' })}
          type='search'
          value={searchInputValue}
        />
        <SelectInput
          aria-label={t({ en: 'Note ownership', pl: 'Właściciel notatki' })}
          items={noteScopeItems.map((item) => ({ ...item, label: t(item.label) }))}
          onValueChange={(value) => {
            if (!value) return;
            setNoteScope(value);
            void refetchNotes();
          }}
          value={noteScope}
        />
      </section>
      {visibleNotes.length === 0 ? (
        <Card as='section' className={css.emptyState} data-appear='1'>
          <h2>
            {notes.length === 0
              ? t({ en: 'No notes yet', pl: 'Brak notatek' })
              : t({ en: 'No matching notes', pl: 'Brak pasujących notatek' })}
          </h2>
          <p>
            {notes.length === 0
              ? t({
                  en: 'Add your first text note or checklist.',
                  pl: 'Dodaj pierwszą notatkę lub listę kontrolną.',
                })
              : t({
                  en: 'Try another search or ownership filter.',
                  pl: 'Spróbuj innego wyszukiwania lub filtra.',
                })}
          </p>
        </Card>
      ) : (
        <section
          aria-label={t({ en: 'Your notes and shared notes', pl: 'Twoje i udostępnione notatki' })}
          className={css.listGrid}
          data-appear='1'
        >
          {visibleNotes.map((note) =>
            note.type === 'shopping_list' ? (
              <CheckedNoteCard key={note.id} note={note} />
            ) : (
              <TextNoteCard key={note.id} note={note} />
            ),
          )}
        </section>
      )}

      <NoteComposer />
    </main>
  );
}
