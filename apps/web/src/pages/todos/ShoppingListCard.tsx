import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { NoteTypeButton } from './NoteTypeButton';
import type { NoteListItem, NoteSummary } from './notes.api';
import {
  useCreateListItemMutation,
  useSetListItemCheckedMutation,
  useUpdateListItemMutation,
  useUpdateNoteMutation,
} from './notes.query';
import css from './TodosPage.module.css';

export function ShoppingListCard({ note }: { note: NoteSummary }) {
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
            maxLength={160}
            onBlur={(event) => {
              const title = event.currentTarget.value.trim();
              if (!title) event.currentTarget.value = note.title;
              else if (title !== note.title) updateNote.mutate({ id: note.id, title });
            }}
            required
          />
        </h2>
        <NoteTypeButton note={note} />
      </div>
      {note.items.length === 0 ? <p className={css.emptyList}>No products yet.</p> : null}
      <ul className={css.items}>
        {note.items.map((item) => (
          <ShoppingListItem autoFocus={item.id === newItemId} item={item} key={item.id} />
        ))}
      </ul>
      <Btn
        aria-label='Add product'
        className={css.addItem}
        icon={<PlusIcon aria-hidden='true' />}
        iconOnly
        loading={createItem.isPending}
        onClick={() => {
          createItem.mutate(
            { name: 'New product', noteId: note.id },
            { onSuccess: (created) => setNewItemId(created.id) },
          );
        }}
        size='sm'
        type='button'
        variant='outlineMain'
      />
    </Card>
  );
}

function ShoppingListItem({ autoFocus, item }: { autoFocus: boolean; item: NoteListItem }) {
  const [checked, setChecked] = useState(item.checked);
  const setItemChecked = useSetListItemCheckedMutation();
  const updateItem = useUpdateListItemMutation();

  useEffect(() => setChecked(item.checked), [item.checked]);

  return (
    <li className={css.item}>
      <input
        aria-label={`Mark ${item.name} as ${checked ? 'not bought' : 'bought'}`}
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
        aria-label='Product name'
        className={checked ? css.done : undefined}
        defaultValue={item.name}
        maxLength={240}
        onFocus={autoFocus ? (event) => event.currentTarget.select() : undefined}
        onBlur={(event) => {
          const name = event.currentTarget.value.trim();
          if (!name) event.currentTarget.value = item.name;
          else if (name !== item.name) updateItem.mutate({ id: item.id, name });
        }}
        required
      />
    </li>
  );
}
