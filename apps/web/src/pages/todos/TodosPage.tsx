import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import type { NoteSummary } from './notes.api';
import { NoteActions } from './NoteActions';
import { NoteComposer } from './NoteComposer';
import { useUpdateNoteMutation } from './notes.query';
import { ShoppingListCard } from './ShoppingListCard';
import css from './TodosPage.module.css';

export function TodosPage({ notes }: { notes: NoteSummary[] }) {
  return (
    <main className={css.page}>
      {notes.length === 0 ? (
        <Card as='section' className={css.emptyState}>
          <h2>No notes yet</h2>
          <p>Add your first text note or checklist.</p>
        </Card>
      ) : (
        <section aria-label='Your notes and shared notes' className={css.listGrid}>
          {notes.map((note) =>
            note.type === 'shopping_list' ? (
              <ShoppingListCard key={note.id} note={note} />
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
