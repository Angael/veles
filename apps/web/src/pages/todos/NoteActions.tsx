import { Share2Icon, Trash2Icon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import type { NoteSummary } from './notes.api';
import { useDeleteNoteMutation, useSetNoteSharedMutation } from './notes.query';
import { NoteTypeButton } from './NoteTypeButton';
import css from './TodosPage.module.css';

export function NoteActions({ note }: { note: NoteSummary }) {
  const deleteNote = useDeleteNoteMutation();
  const setShared = useSetNoteSharedMutation();

  if (!note.isOwned) return <span className={css.sharedBy}>Shared by {note.ownerName}</span>;

  return (
    <div className={css.noteActions}>
      <NoteTypeButton note={note} />
      <Btn
        aria-label={note.shared ? 'Stop sharing note' : 'Share note with friends'}
        aria-pressed={note.shared}
        icon={<Share2Icon aria-hidden='true' />}
        iconOnly
        loading={setShared.isPending}
        onClick={() => setShared.mutate({ id: note.id, shared: !note.shared })}
        size='sm'
        type='button'
        variant={note.shared ? 'outlineMain' : 'ghost'}
      />
      <Btn
        aria-label='Delete note'
        icon={<Trash2Icon aria-hidden='true' />}
        iconOnly
        loading={deleteNote.isPending}
        onClick={() => {
          if (window.confirm(`Delete “${note.title}”? This cannot be undone.`)) {
            deleteNote.mutate({ id: note.id });
          }
        }}
        size='sm'
        type='button'
        variant='ghostDanger'
      />
    </div>
  );
}
