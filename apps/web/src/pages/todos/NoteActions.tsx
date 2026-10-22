import { LockIcon, Share2Icon, Trash2Icon, UsersIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { MenuBtn, MenuBtnItem, MenuBtnPopup, MenuBtnRoot } from '@/components/ui/menu-btn/MenuBtn';
import type { NoteSummary } from './notes.api';
import { useDeleteNoteMutation, useSetNoteSharedMutation } from './notes.query';
import { NoteTypeButton } from './NoteTypeButton';
import type { useNoteSave } from './useNoteSave';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function NoteActions({
  note,
  noteSave,
}: {
  note: NoteSummary;
  noteSave: ReturnType<typeof useNoteSave>;
}) {
  const { t } = useI18n();
  const deleteNote = useDeleteNoteMutation();
  const setShared = useSetNoteSharedMutation();

  if (!note.isOwned) {
    return (
      <div className={css.noteActions}>
        <span className={css.sharedBy}>
          {t({ en: `Shared by ${note.ownerName}`, pl: `Udostępnia: ${note.ownerName}` })}
        </span>
        <NoteTypeButton note={note} noteSave={noteSave} />
      </div>
    );
  }

  return (
    <div className={css.noteActions}>
      <NoteTypeButton note={note} noteSave={noteSave} />
      <MenuBtnRoot>
        <Btn
          aria-label={
            note.shared
              ? t({
                  en: 'Sharing options, currently shared with friends',
                  pl: 'Opcje udostępniania, obecnie udostępniona znajomym',
                })
              : t({
                  en: 'Sharing options, currently private',
                  pl: 'Opcje udostępniania, obecnie prywatna',
                })
          }
          icon={<Share2Icon aria-hidden='true' />}
          iconOnly
          loading={setShared.isPending}
          render={<MenuBtn />}
          size='sm'
          type='button'
          variant={note.shared ? 'ghostSuccess' : 'ghost'}
        />
        <MenuBtnPopup
          aria-label={t({ en: 'Note sharing options', pl: 'Opcje udostępniania notatki' })}
          description={t({
            en: 'Choose who can access this note.',
            pl: 'Wybierz, kto ma dostęp do tej notatki.',
          })}
          heading={t({ en: 'Share note', pl: 'Udostępnij notatkę' })}
        >
          <MenuBtnItem
            description={t({
              en: 'Let your friends view and edit this note',
              pl: 'Pozwól znajomym oglądać i edytować tę notatkę',
            })}
            icon={<UsersIcon aria-hidden='true' />}
            label={t({ en: 'Share with friends', pl: 'Udostępnij znajomym' })}
            onClick={() => {
              if (!note.shared) setShared.mutate({ id: note.id, shared: true });
            }}
          />
          <MenuBtnItem
            description={t({
              en: 'Only you can access this note',
              pl: 'Tylko Ty masz dostęp do tej notatki',
            })}
            icon={<LockIcon aria-hidden='true' />}
            label={t({ en: 'Keep note private', pl: 'Zostaw jako prywatną' })}
            onClick={() => {
              if (note.shared) setShared.mutate({ id: note.id, shared: false });
            }}
          />
        </MenuBtnPopup>
      </MenuBtnRoot>
      <Btn
        aria-label={t({ en: 'Delete note', pl: 'Usuń notatkę' })}
        icon={<Trash2Icon aria-hidden='true' />}
        iconOnly
        loading={deleteNote.isPending}
        onClick={() => {
          if (
            window.confirm(
              t({
                en: `Delete “${note.title}”? This cannot be undone.`,
                pl: `Usunąć „${note.title}”? Tego nie można cofnąć.`,
              }),
            )
          ) {
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
