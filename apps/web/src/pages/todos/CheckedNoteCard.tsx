import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { NoteActions } from './NoteActions';
import type { NoteListItem, NoteSummary } from './notes.api';
import {
  useCreateListItemMutation,
  useDeleteListItemMutation,
  useSetListItemCheckedMutation,
  useUpdateListItemMutation,
  useUpdateNoteMutation,
} from './notes.query';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function CheckedNoteCard({ note }: { note: NoteSummary }) {
  const { t } = useI18n();
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const createItem = useCreateListItemMutation();
  const updateNote = useUpdateNoteMutation();

  /** Appends a placeholder item and focuses it once created; shared by the button and Enter key. */
  const addItem = () => {
    if (createItem.isPending) return;
    createItem.mutate(
      { name: t({ en: 'New item', pl: 'Nowa pozycja' }), noteId: note.id },
      { onSuccess: (created) => setNewItemId(created.id) },
    );
  };

  return (
    <Card as='article' className={css.listCard}>
      <div className={css.cardHeader}>
        <h2>
          <SeamlessTextInput
            aria-label={t({ en: 'Checklist title', pl: 'Tytuł listy' })}
            className={css.titleInput}
            defaultValue={note.title}
            enterKeyHint='next'
            maxLength={160}
            onBlur={(event) => {
              const title = event.currentTarget.value.trim();
              if (!title) event.currentTarget.value = note.title;
              else if (title !== note.title) updateNote.mutate({ id: note.id, title });
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                addItem();
              }
            }}
            required
          />
        </h2>
        <NoteActions note={note} />
      </div>
      {note.items.length === 0 ? (
        <p className={css.emptyList}>{t({ en: 'No items yet.', pl: 'Brak pozycji.' })}</p>
      ) : null}
      <ul className={css.items}>
        {note.items.map((item) => (
          <CheckedNoteItem
            autoFocus={item.id === newItemId}
            item={item}
            key={item.id}
            onEnter={addItem}
          />
        ))}
      </ul>
      <Btn
        aria-label={t({ en: 'Add item', pl: 'Dodaj pozycję' })}
        className={css.addItem}
        icon={<PlusIcon aria-hidden='true' />}
        loading={createItem.isPending}
        onClick={addItem}
        size='sm'
        type='button'
        variant='outlineMain'
      >
        {t({ en: 'Add item', pl: 'Dodaj pozycję' })}
      </Btn>
    </Card>
  );
}

function CheckedNoteItem({
  autoFocus,
  item,
  onEnter,
}: {
  autoFocus: boolean;
  item: NoteListItem;
  onEnter: () => void;
}) {
  const { t } = useI18n();
  const [checked, setChecked] = useState(item.checked);
  const setItemChecked = useSetListItemCheckedMutation();
  const updateItem = useUpdateListItemMutation();
  const deleteItem = useDeleteListItemMutation();

  useEffect(() => setChecked(item.checked), [item.checked]);

  return (
    <li className={css.item}>
      <input
        aria-label={
          checked
            ? t({
                en: `Mark ${item.name} as incomplete`,
                pl: `Oznacz ${item.name} jako niezrobione`,
              })
            : t({ en: `Mark ${item.name} as complete`, pl: `Oznacz ${item.name} jako zrobione` })
        }
        checked={checked}
        disabled={setItemChecked.isPending}
        onChange={(event) => {
          const nextChecked = event.currentTarget.checked;
          setChecked(nextChecked);
          setItemChecked.mutate(
            { checked: nextChecked, id: item.id },
            { onError: () => setChecked(!nextChecked) },
          );
        }}
        type='checkbox'
      />
      <SeamlessTextInput
        autoFocus={autoFocus}
        aria-label={t({ en: 'Checklist item', pl: 'Pozycja listy' })}
        className={checked ? css.done : undefined}
        defaultValue={item.name}
        enterKeyHint='next'
        maxLength={240}
        onFocus={autoFocus ? (event) => event.currentTarget.select() : undefined}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            onEnter();
          } else if (
            !deleteItem.isPending &&
            (event.key === 'Backspace' || event.key === 'Delete') &&
            !event.currentTarget.value.trim()
          ) {
            event.preventDefault();
            deleteItem.mutate({ id: item.id });
          }
        }}
        onBlur={(event) => {
          const name = event.currentTarget.value.trim();
          if (!name) event.currentTarget.value = item.name;
          else if (name !== item.name) updateItem.mutate({ id: item.id, name });
        }}
        required
      />
      <Btn
        aria-label={t({ en: `Delete ${item.name}`, pl: `Usuń: ${item.name}` })}
        className={css.deleteItem}
        icon={<Trash2Icon aria-hidden='true' />}
        iconOnly
        loading={deleteItem.isPending}
        onClick={() => deleteItem.mutate({ id: item.id })}
        size='sm'
        type='button'
        variant='ghostDanger'
      />
    </li>
  );
}
