import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import type { NoteListItem, NoteSummary } from './notes.api';
import {
  useCreateListItemMutation,
  useSetListItemCheckedMutation,
  useUpdateListItemMutation,
  useUpdateNoteMutation,
} from './notes.query';
import css from './TodosPage.module.css';

export function ShoppingListCard({ note }: { note: NoteSummary }) {
  const [formKey, setFormKey] = useState(0);
  const createItem = useCreateListItemMutation();
  const updateNote = useUpdateNoteMutation();

  return (
    <Card as='article' className={css.listCard}>
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
      {note.items.length === 0 ? <p className={css.emptyList}>No products yet.</p> : null}
      <ul className={css.items}>
        {note.items.map((item) => (
          <ShoppingListItem item={item} key={item.id} />
        ))}
      </ul>
      <TypedForm
        key={formKey}
        aria-label={`Add a product to ${note.title}`}
        className={css.productForm}
        onSubmit={async (data) => {
          await createItem.mutateAsync({
            name: data.string('name'),
            noteId: note.id,
          });
          setFormKey((key) => key + 1);
        }}
      >
        <SeamlessTextInput
          aria-label='Product'
          maxLength={240}
          name='name'
          placeholder='New product'
          required
        />
        <Btn
          aria-label='Add product'
          icon={<PlusIcon aria-hidden='true' />}
          iconOnly
          loading={createItem.isPending}
          size='sm'
          type='submit'
          variant='outlineMain'
        />
      </TypedForm>
    </Card>
  );
}

function ShoppingListItem({ item }: { item: NoteListItem }) {
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
        aria-label='Product name'
        className={checked ? css.done : undefined}
        defaultValue={item.name}
        maxLength={240}
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
