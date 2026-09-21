import { Card } from '@/components/ui/card/Card';
import type { NoteSummary } from './notes.api';
import { NoteComposer } from './NoteComposer';
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
        <section aria-label='Your notes' className={css.listGrid}>
          {notes.map((note) =>
            note.type === 'shopping_list' ? (
              <ShoppingListCard key={note.id} note={note} />
            ) : (
              <Card as='article' className={css.noteCard} key={note.id}>
                <h2>{note.title}</h2>
                {note.content ? <p>{note.content}</p> : <p className={css.emptyList}>Empty note</p>}
              </Card>
            ),
          )}
        </section>
      )}

      <NoteComposer />
    </main>
  );
}
