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

export function CheckedNoteCard({ note }: { note: NoteSummary }) {
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const createItem = useCreateListItemMutation();
  const updateNote = useUpdateNoteMutation();

  return (
    <Card as='article' className={css.listCard}>
      <div className={css.cardHeader}>
        <h2>
          <SeamlessTextInput
            aria-label='Checklist title'
            className={css.titleInput}
            defaultValue={note.title}
            readOnly={!note.isOwned}
            maxLength={160}
            onBlur={(event) => {
              if (!note.isOwned) return;
              const title = event.currentTarget.value.trim();
              if (!title) event.currentTarget.value = note.title;
              else if (title !== note.title) updateNote.mutate({ id: note.id, title });
            }}
            required
          />
        </h2>
        <NoteActions note={note} />
      </div>
      {note.items.length === 0 ? <p className={css.emptyList}>No items yet.</p> : null}
      <ul className={css.items}>
        {note.items.map((item) => (
          <CheckedNoteItem
            autoFocus={note.isOwned && item.id === newItemId}
            isOwned={note.isOwned}
            item={item}
            key={item.id}
          />
        ))}
      </ul>
      {note.isOwned && (
        <Btn
          aria-label='Add item'
          className={css.addItem}
          icon={<PlusIcon aria-hidden='true' />}
          loading={createItem.isPending}
          onClick={() => {
            createItem.mutate(
              { name: 'New item', noteId: note.id },
              { onSuccess: (created) => setNewItemId(created.id) },
            );
          }}
          size='sm'
          type='button'
          variant='outlineMain'
        >
          Add item
        </Btn>
      )}
    </Card>
  );
}

function CheckedNoteItem({
  autoFocus,
  isOwned,
  item,
}: {
  autoFocus: boolean;
  isOwned: boolean;
  item: NoteListItem;
}) {
  const [checked, setChecked] = useState(item.checked);
  const setItemChecked = useSetListItemCheckedMutation();
  const updateItem = useUpdateListItemMutation();
  const deleteItem = useDeleteListItemMutation();

  useEffect(() => setChecked(item.checked), [item.checked]);

  return (
    <li className={css.item}>
      <input
        aria-label={`Mark ${item.name} as ${checked ? 'incomplete' : 'complete'}`}
        checked={checked}
        disabled={!isOwned || setItemChecked.isPending}
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
        aria-label='Checklist item'
        className={checked ? css.done : undefined}
        defaultValue={item.name}
        readOnly={!isOwned}
        maxLength={240}
        onFocus={autoFocus ? (event) => event.currentTarget.select() : undefined}
        onKeyDown={(event) => {
          if (
            isOwned &&
            !deleteItem.isPending &&
            (event.key === 'Backspace' || event.key === 'Delete') &&
            !event.currentTarget.value.trim()
          ) {
            event.preventDefault();
            deleteItem.mutate({ id: item.id });
          }
        }}
        onBlur={(event) => {
          if (!isOwned) return;
          const name = event.currentTarget.value.trim();
          if (!name) event.currentTarget.value = item.name;
          else if (name !== item.name) updateItem.mutate({ id: item.id, name });
        }}
        required
      />
      {checked && isOwned && (
        <Btn
          aria-label={`Delete ${item.name}`}
          className={css.deleteItem}
          icon={<Trash2Icon aria-hidden='true' />}
          iconOnly
          loading={deleteItem.isPending}
          onClick={() => deleteItem.mutate({ id: item.id })}
          size='sm'
          type='button'
          variant='ghostDanger'
        />
      )}
    </li>
  );
}
