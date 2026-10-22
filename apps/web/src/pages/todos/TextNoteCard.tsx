import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { NoteActions } from './NoteActions';
import { NoteConflict } from './NoteConflict';
import type { NoteSummary } from './notes.api';
import { useNoteSave } from './useNoteSave';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function TextNoteCard({ note }: { note: NoteSummary }) {
  const { t } = useI18n();
  const noteSave = useNoteSave(note);

  return (
    <Card as='article' className={css.noteCard}>
      <div className={css.cardHeader}>
        <h2>
          <SeamlessTextInput
            aria-label={t({ en: 'Note title', pl: 'Tytuł notatki' })}
            className={css.titleInput}
            defaultValue={note.title}
            maxLength={160}
            readOnly={noteSave.stale}
            ref={noteSave.titleRef}
            onBlur={(event) => noteSave.saveTitle(event.currentTarget)}
            required
          />
        </h2>
        <NoteActions noteSave={noteSave} note={note} />
      </div>
      <NoteConflict noteSave={noteSave} />
      <SeamlessTextarea
        aria-label={t({ en: 'Note content', pl: 'Treść notatki' })}
        className={css.contentInput}
        defaultValue={note.content}
        maxLength={16000}
        readOnly={noteSave.stale}
        ref={noteSave.contentRef}
        onBlur={(event) => noteSave.saveContent(event.currentTarget)}
        placeholder={t({ en: 'Write your note…', pl: 'Napisz notatkę…' })}
        rows={3}
      />
    </Card>
  );
}
