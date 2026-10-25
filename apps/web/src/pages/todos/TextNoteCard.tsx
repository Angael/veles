import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { NoteActions } from './NoteActions';
import type { NoteSummary } from './notes.api';
import { useUpdateNoteMutation } from './notes.query';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function TextNoteCard({ note }: { note: NoteSummary }) {
  const { t } = useI18n();
  const updateNote = useUpdateNoteMutation();

  return (
    <Card as='article' className={css.noteCard} id={`note-${note.id}`}>
      <div className={css.cardHeader}>
        <h2>
          <SeamlessTextInput
            aria-label={t({ en: 'Note title', pl: 'Tytuł notatki' })}
            className={css.titleInput}
            defaultValue={note.title}
            maxLength={160}
            onBlur={(event) => {
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
        aria-label={t({ en: 'Note content', pl: 'Treść notatki' })}
        className={css.contentInput}
        defaultValue={note.content}
        maxLength={16000}
        onBlur={(event) => {
          if (event.currentTarget.value !== note.content) {
            updateNote.mutate({ id: note.id, content: event.currentTarget.value });
          }
        }}
        placeholder={t({ en: 'Write your note…', pl: 'Napisz notatkę…' })}
        rows={3}
      />
    </Card>
  );
}
