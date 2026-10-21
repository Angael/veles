import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { NoteActions } from './NoteActions';
import { NoteConflictNotice } from './NoteConflictNotice';
import type { NoteSummary } from './notes.api';
import { useNoteDraft } from './useNoteDraft';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function TextNoteCard({ note }: { note: NoteSummary }) {
  const { t } = useI18n();
  const noteDraft = useNoteDraft(note);
  const { draft, setDraft } = noteDraft;

  return (
    <Card as='article' className={css.noteCard}>
      <div className={css.cardHeader}>
        <h2>
          <SeamlessTextInput
            aria-label={t({ en: 'Note title', pl: 'Tytuł notatki' })}
            className={css.titleInput}
            maxLength={160}
            onBlur={noteDraft.saveTitle}
            onChange={(event) => {
              const title = event.currentTarget.value;
              setDraft((current) => ({ ...current, title }));
            }}
            required
            value={draft.title}
          />
        </h2>
        <NoteActions note={note} />
      </div>
      <NoteConflictNotice noteDraft={noteDraft} />
      <SeamlessTextarea
        aria-label={t({ en: 'Note content', pl: 'Treść notatki' })}
        className={css.contentInput}
        maxLength={16000}
        onBlur={noteDraft.saveContent}
        onChange={(event) => {
          const content = event.currentTarget.value;
          setDraft((current) => ({ ...current, content }));
        }}
        placeholder={t({ en: 'Write your note…', pl: 'Napisz notatkę…' })}
        rows={3}
        value={draft.content}
      />
    </Card>
  );
}
