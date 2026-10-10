import { useLiveQuery } from '@tanstack/react-db';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useThrottledValue } from '@tanstack/react-pacer';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card/Card';
import { SelectInput } from '@/components/ui/select-input/SelectInput';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { filterAndRankBySearch, type RankedSearchFields } from '@/lib/search/filterAndRankBySearch';
import { CheckedNoteCard } from './CheckedNoteCard';
import { useListItemsCollection } from './listItems.collection';
import type { NoteSummary } from './notes.api';
import { NoteComposer } from './NoteComposer';
import { notesQueryOptions } from './notes.query';
import { TextNoteCard } from './TextNoteCard';
import css from './TodosPage.module.css';

const noteScopeItems = [
  { label: 'All notes', value: 'all' },
  { label: 'Your notes', value: 'owned' },
] as const;

type SearchableNote = NoteSummary & { itemNames: string[] };

const noteSearchFields = [
  (note) => note.title,
  (note) => note.content,
  (note) => note.itemNames,
] satisfies RankedSearchFields<SearchableNote>;

export function TodosPage() {
  const { data: notes, refetch: refetchNotes } = useSuspenseQuery(notesQueryOptions());
  const [noteScope, setNoteScope] = useState<'all' | 'owned'>('all');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [search] = useThrottledValue(searchInputValue, { wait: 200 });
  const listItems = useListItemsCollection();
  // Same collection the cards write to, so search sees renamed or added items immediately.
  const { data: items } = useLiveQuery((q) => q.from({ item: listItems }), [listItems]);
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
      <section aria-label='Filter notes' className={css.controls} data-appear>
        <TextInput
          aria-label='Search notes'
          autoComplete='off'
          name='search'
          onValueChange={setSearchInputValue}
          placeholder='Search notes'
          type='search'
          value={searchInputValue}
        />
        <SelectInput
          aria-label='Note ownership'
          items={noteScopeItems}
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
          <h2>{notes.length === 0 ? 'No notes yet' : 'No matching notes'}</h2>
          <p>
            {notes.length === 0
              ? 'Add your first text note or checklist.'
              : 'Try another search or ownership filter.'}
          </p>
        </Card>
      ) : (
        <section aria-label='Your notes and shared notes' className={css.listGrid} data-appear='1'>
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
