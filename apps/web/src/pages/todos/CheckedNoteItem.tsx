import { Trash2Icon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { ChecklistItemInput, focusField } from './ChecklistItemInput';
import { useListItemsCollection } from './listItems.collection';
import type { NoteListItem } from './notes.api';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function CheckedNoteItem({
  autoFocus,
  item,
  onEnter,
  onMergeIntoPrevious,
  onRemove,
}: {
  autoFocus: boolean;
  item: NoteListItem;
  onEnter: () => void;
  onMergeIntoPrevious?: (text: string) => void;
  onRemove: (direction?: 'previous' | 'next') => void;
}) {
  const { t } = useI18n();
  const nameRef = useRef<HTMLTextAreaElement>(null);
  // No local state, pending flags, or manual rollback: `item` is already optimistic.
  const listItems = useListItemsCollection();

  // A new item takes focus once it mounts, without the browser's jump to the field.
  useEffect(() => {
    if (autoFocus) focusField(nameRef.current, 'end');
  }, [autoFocus]);

  return (
    <li className={css.item}>
      <input
        aria-label={
          item.checked
            ? t(
                item.name
                  ? {
                      en: `Mark ${item.name} as incomplete`,
                      pl: `Oznacz ${item.name} jako niezrobione`,
                    }
                  : { en: 'Mark item as incomplete', pl: 'Oznacz pozycję jako niezrobioną' },
              )
            : t(
                item.name
                  ? { en: `Mark ${item.name} as complete`, pl: `Oznacz ${item.name} jako zrobione` }
                  : { en: 'Mark item as complete', pl: 'Oznacz pozycję jako zrobioną' },
              )
        }
        checked={item.checked}
        onChange={(event) => {
          const { checked } = event.currentTarget;
          listItems.update(item.id, (draft) => {
            draft.checked = checked;
          });
        }}
        type='checkbox'
      />
      <ChecklistItemInput
        aria-label={t({ en: 'Checklist item', pl: 'Pozycja listy' })}
        className={item.checked ? css.done : undefined}
        data-item-id={item.id}
        defaultValue={item.name}
        onBlur={(event) => {
          // The item is being deleted (see `removeItem` in CheckedNoteCard), so nothing to save.
          if (event.currentTarget.hasAttribute('data-removed')) return;
          const name = event.currentTarget.value.trim();
          if (name !== item.name) {
            listItems.update(item.id, (draft) => {
              draft.name = name;
            });
          }
        }}
        onEnter={onEnter}
        onMergeIntoPrevious={onMergeIntoPrevious}
        onRemoveEmpty={onRemove}
        placeholder={t({ en: 'New item', pl: 'Nowa pozycja' })}
        ref={nameRef}
      />
      <Btn
        aria-label={t(
          item.name
            ? { en: `Delete ${item.name}`, pl: `Usuń: ${item.name}` }
            : { en: 'Delete item', pl: 'Usuń pozycję' },
        )}
        className={css.deleteItem}
        icon={<Trash2Icon aria-hidden='true' />}
        iconOnly
        onClick={() => onRemove()}
        // Keeps focus in the edited item, so the mobile keyboard does not close and reopen.
        onMouseDown={(event) => event.preventDefault()}
        size='sm'
        type='button'
        variant='ghostDanger'
      />
    </li>
  );
}
