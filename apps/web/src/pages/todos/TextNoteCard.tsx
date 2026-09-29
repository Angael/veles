import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { EditConflict } from './EditConflict';
import { NoteActions } from './NoteActions';
import type { NoteSummary } from './notes.api';
import { useUpdateNoteMutation } from './notes.query';
import css from './TodosPage.module.css';
import { useSyncedDraft } from './useSyncedDraft';

export function TextNoteCard({ note }: { note: NoteSummary }) {
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
