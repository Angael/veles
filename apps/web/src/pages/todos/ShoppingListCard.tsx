import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import type { NoteListItem, NoteSummary } from './notes.api';
import { useCreateListItemMutation, useSetListItemCheckedMutation } from './notes.query';
import css from './TodosPage.module.css';

export function ShoppingListCard({ note }: { note: NoteSummary }) {
  const [formKey, setFormKey] = useState(0);
  const createItem = useCreateListItemMutation();

  return (
    <Card as='article' className={css.listCard}>
      <h2>{note.title}</h2>
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
            quantity: data.string('quantity'),
            unit: data.string('unit'),
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
        <div className={css.quantityFields}>
          <SeamlessTextInput
            aria-label='Quantity'
            maxLength={40}
            name='quantity'
            placeholder='Qty'
          />
          <SeamlessTextInput aria-label='Unit' maxLength={40} name='unit' placeholder='Unit' />
        </div>
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
      <span className={checked ? css.done : undefined}>{item.name}</span>
      {item.quantity || item.unit ? (
        <span className={css.quantity}>{[item.quantity, item.unit].filter(Boolean).join(' ')}</span>
      ) : null}
    </li>
  );
}
