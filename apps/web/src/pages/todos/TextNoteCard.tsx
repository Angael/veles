import { Card } from '@/components/ui/card/Card';
import { ConflictNotice } from '@/components/ui/conflict-notice/ConflictNotice';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { NoteActions } from './NoteActions';
import type { NoteSummary } from './notes.api';
import { useNoteSave } from './useNoteSave';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function TextNoteCard({ note }: { note: NoteSummary }) {
  const { t } = useI18n();
  const noteSave = useNoteSave(note);

  return (
    <Card as='article' className={css.noteCard} ref={noteSave.cardRef}>
      <div className={css.cardHeader}>
        <h2>
          <SeamlessTextInput
            aria-label={t({ en: 'Note title', pl: 'Tytuł notatki' })}
            className={css.titleInput}
            defaultValue={note.title}
            key={noteSave.inputsKey}
            maxLength={160}
            onBlur={(event) => {
              const title = event.currentTarget.value.trim();
              if (!title) event.currentTarget.value = note.title;
              else if (title !== note.title) noteSave.save({ title });
            }}
            required
          />
        </h2>
        <NoteActions note={note} />
      </div>
      {noteSave.conflicted ? (
        <ConflictNotice
          className={css.conflict}
          loading={noteSave.loading}
          onKeepMine={noteSave.keepMine}
          onLoadLatest={noteSave.loadLatest}
        />
      ) : null}
      <SeamlessTextarea
        aria-label={t({ en: 'Note content', pl: 'Treść notatki' })}
        className={css.contentInput}
        defaultValue={note.content}
        key={noteSave.inputsKey}
        maxLength={16000}
        onBlur={(event) => {
          const content = event.currentTarget.value;
          if (content !== note.content) noteSave.save({ content });
        }}
        placeholder={t({ en: 'Write your note…', pl: 'Napisz notatkę…' })}
        rows={3}
      />
    </Card>
  );
}
