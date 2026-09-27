import { LockIcon, Share2Icon, Trash2Icon, UsersIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { MenuBtn, MenuBtnItem, MenuBtnPopup, MenuBtnRoot } from '@/components/ui/menu-btn/MenuBtn';
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
      <MenuBtnRoot>
        <Btn
          aria-label={`Sharing options, currently ${note.shared ? 'shared with friends' : 'private'}`}
          icon={<Share2Icon aria-hidden='true' />}
          iconOnly
          loading={setShared.isPending}
          render={<MenuBtn />}
          size='sm'
          type='button'
          variant={note.shared ? 'ghostSuccess' : 'ghost'}
        />
        <MenuBtnPopup
          aria-label='Note sharing options'
          description='Choose who can access this note.'
          heading='Share note'
        >
          <MenuBtnItem
            description='Let your friends view this note'
            icon={<UsersIcon aria-hidden='true' />}
            label='Share with friends'
            onClick={() => {
              if (!note.shared) setShared.mutate({ id: note.id, shared: true });
            }}
          />
          <MenuBtnItem
            description='Only you can access this note'
            icon={<LockIcon aria-hidden='true' />}
            label='Keep note private'
            onClick={() => {
              if (note.shared) setShared.mutate({ id: note.id, shared: false });
            }}
          />
        </MenuBtnPopup>
      </MenuBtnRoot>
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
