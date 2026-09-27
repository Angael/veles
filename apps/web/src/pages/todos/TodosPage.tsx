import { useThrottledValue } from '@tanstack/react-pacer';
import { useState } from 'react';
import { Card } from '@/components/ui/card/Card';
import { SelectInput } from '@/components/ui/select-input/SelectInput';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { filterAndRankBySearch, type RankedSearchFields } from '@/lib/search/filterAndRankBySearch';
import { CheckedNoteCard } from './CheckedNoteCard';
import type { NoteSummary } from './notes.api';
import { NoteActions } from './NoteActions';
import { NoteComposer } from './NoteComposer';
import { useUpdateNoteMutation } from './notes.query';
import css from './TodosPage.module.css';

const noteScopeItems = [
  { label: 'All notes', value: 'all' },
  { label: 'Your notes', value: 'owned' },
] as const;

const noteSearchFields = [
  (note) => note.title,
  (note) => note.content,
  (note) => note.items.map((item) => item.name),
] satisfies RankedSearchFields<NoteSummary>;

export function TodosPage({ notes }: { notes: NoteSummary[] }) {
  const [noteScope, setNoteScope] = useState<'all' | 'owned'>('all');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [search] = useThrottledValue(searchInputValue, { wait: 200 });
  const scopedNotes = noteScope === 'owned' ? notes.filter((note) => note.isOwned) : notes;
  const visibleNotes = filterAndRankBySearch(scopedNotes, search, noteSearchFields);

  return (
    <main className={css.page}>
      <section aria-label='Filter notes' className={css.controls}>
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
            if (value) setNoteScope(value);
          }}
          value={noteScope}
        />
      </section>
      {visibleNotes.length === 0 ? (
        <Card as='section' className={css.emptyState}>
          <h2>{notes.length === 0 ? 'No notes yet' : 'No matching notes'}</h2>
          <p>
            {notes.length === 0
              ? 'Add your first text note or checklist.'
              : 'Try another search or ownership filter.'}
          </p>
        </Card>
      ) : (
        <section aria-label='Your notes and shared notes' className={css.listGrid}>
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

  return (
    <Card as='article' className={css.noteCard}>
      <div className={css.cardHeader}>
        <h2>
          <SeamlessTextInput
            aria-label='Note title'
            className={css.titleInput}
            defaultValue={note.title}
            readOnly={!note.isOwned}
            maxLength={160}
            onBlur={(event) => {
              if (!note.isOwned) return;
              const title = event.currentTarget.value.trim();
              if (!title) event.currentTarget.value = note.title;
              else if (title !== note.title) updateNote.mutate({ id: note.id, title });
            }}
            required
          />
        </h2>
        <NoteActions note={note} />
      </div>
      <SeamlessTextarea
        aria-label='Note content'
        className={css.contentInput}
        defaultValue={note.content}
        readOnly={!note.isOwned}
        maxLength={16000}
        onBlur={(event) => {
          if (!note.isOwned) return;
          if (event.currentTarget.value !== note.content) {
            updateNote.mutate({ id: note.id, content: event.currentTarget.value });
          }
        }}
        placeholder='Write your note…'
        rows={3}
      />
    </Card>
  );
}
