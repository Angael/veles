import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { EditConflict } from './EditConflict';
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
import { useSyncedDraft } from './useSyncedDraft';

export function CheckedNoteCard({ note }: { note: NoteSummary }) {
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const createItem = useCreateListItemMutation();
  const updateNote = useUpdateNoteMutation();
  const title = useSyncedDraft({
    normalize: (value) => value.trim() || null,
    save: (value, base, onSuccess) =>
      updateNote.mutate({ base, field: 'title', id: note.id, value }, { onSuccess }),
    serverValue: note.title,
  });

  return (
    <Card as='article' className={css.listCard}>
      <div className={css.cardHeader}>
        <h2>
          <SeamlessTextInput
            aria-label='Checklist title'
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
      {note.items.length === 0 ? <p className={css.emptyList}>No items yet.</p> : null}
      <ul className={css.items}>
        {note.items.map((item) => (
          <CheckedNoteItem autoFocus={item.id === newItemId} item={item} key={item.id} />
        ))}
      </ul>
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
    </Card>
  );
}

function CheckedNoteItem({ autoFocus, item }: { autoFocus: boolean; item: NoteListItem }) {
  const [checked, setChecked] = useState(item.checked);
  const setItemChecked = useSetListItemCheckedMutation();
  const updateItem = useUpdateListItemMutation();
  const deleteItem = useDeleteListItemMutation();
  const name = useSyncedDraft({
    normalize: (value) => value.trim() || null,
    save: (value, base, onSuccess) =>
      updateItem.mutate({ base, id: item.id, name: value }, { onSuccess }),
    serverValue: item.name,
  });

  useEffect(() => setChecked(item.checked), [item.checked]);

  return (
    <li className={css.item}>
      <input
        aria-label={`Mark ${item.name} as ${checked ? 'incomplete' : 'complete'}`}
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
        aria-label='Checklist item'
        className={checked ? css.done : undefined}
        maxLength={240}
        onFocus={autoFocus ? (event) => event.currentTarget.select() : undefined}
        onKeyDown={(event) => {
          if (
            !deleteItem.isPending &&
            (event.key === 'Backspace' || event.key === 'Delete') &&
            !event.currentTarget.value.trim()
          ) {
            event.preventDefault();
            deleteItem.mutate({ id: item.id });
          }
        }}
        required
        {...name.inputProps}
      />
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
      {name.conflict === null ? null : (
        <EditConflict
          onAcceptTheirs={name.acceptTheirs}
          onKeepMine={name.keepMine}
          theirs={name.conflict}
        />
      )}
    </li>
  );
}
