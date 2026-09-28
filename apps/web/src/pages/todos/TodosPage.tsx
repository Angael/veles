import { useSuspenseQuery } from '@tanstack/react-query';
import { useThrottledValue } from '@tanstack/react-pacer';
import { useState } from 'react';
import { Card } from '@/components/ui/card/Card';
import { SelectInput } from '@/components/ui/select-input/SelectInput';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { filterAndRankBySearch, type RankedSearchFields } from '@/lib/search/filterAndRankBySearch';
import { CheckedNoteCard } from './CheckedNoteCard';
import { EditConflict } from './EditConflict';
import type { NoteSummary } from './notes.api';
import { NoteActions } from './NoteActions';
import { NoteComposer } from './NoteComposer';
import { notesQueryOptions, useUpdateNoteMutation } from './notes.query';
import css from './TodosPage.module.css';
import { useSyncedDraft } from './useSyncedDraft';

const noteScopeItems = [
  { label: 'All notes', value: 'all' },
  { label: 'Your notes', value: 'owned' },
] as const;

const noteSearchFields = [
  (note) => note.title,
  (note) => note.content,
  (note) => note.items.map((item) => item.name),
] satisfies RankedSearchFields<NoteSummary>;

export function TodosPage() {
  const { data: notes, refetch: refetchNotes } = useSuspenseQuery(notesQueryOptions());
  const [noteScope, setNoteScope] = useState<'all' | 'owned'>('all');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [search] = useThrottledValue(searchInputValue, { wait: 200 });
  const scopedNotes = noteScope === 'owned' ? notes.filter((note) => note.isOwned) : notes;
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

function TextNoteCard({ note }: { note: NoteSummary }) {
  const updateNote = useUpdateNoteMutation();
  const title = useSyncedDraft({
    normalize: (value) => value.trim() || null,
    save: (value, base, onSuccess) =>
      updateNote.mutate({ base, field: 'title', id: note.id, value }, { onSuccess }),
    serverValue: note.title,
  });
  const content = useSyncedDraft({
    save: (value, base, onSuccess) =>
      updateNote.mutate({ base, field: 'content', id: note.id, value }, { onSuccess }),
    serverValue: note.content,
  });

  return (
    <Card as='article' className={css.noteCard}>
      <div className={css.cardHeader}>
        <h2>
          <SeamlessTextInput
            aria-label='Note title'
            className={css.titleInput}
            maxLength={160}
            required
            {...title.inputProps}
          />
        </h2>
        <NoteActions note={note} />
      </div>
      {title.conflict === null ? null : (
        <EditConflict
          onAcceptTheirs={title.acceptTheirs}
          onKeepMine={title.keepMine}
          theirs={title.conflict}
        />
      )}
      <SeamlessTextarea
        aria-label='Note content'
        className={css.contentInput}
        maxLength={16000}
        placeholder='Write your note…'
        rows={3}
        {...content.inputProps}
      />
      {content.conflict === null ? null : (
        <EditConflict
          onAcceptTheirs={content.acceptTheirs}
          onKeepMine={content.keepMine}
          theirs={content.conflict}
        />
      )}
    </Card>
  );
}
