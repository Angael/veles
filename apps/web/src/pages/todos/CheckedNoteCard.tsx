import { eq, useLiveQuery } from '@tanstack/react-db';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { useListItemsCollection } from './listItems.collection';
import { NoteActions } from './NoteActions';
import type { NoteListItem, NoteSummary } from './notes.api';
import { useUpdateNoteMutation } from './notes.query';
import css from './TodosPage.module.css';

export function CheckedNoteCard({ note }: { note: NoteSummary }) {
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const listItems = useListItemsCollection();
  const updateNote = useUpdateNoteMutation();
  // Live query: re-runs incrementally whenever a row in the collection changes, including
  // optimistic writes from this card, another card, or a background refetch.
  const { data: items } = useLiveQuery(
    (q) =>
      q
        .from({ item: listItems })
        .where(({ item }) => eq(item.noteId, note.id))
        .orderBy(({ item }) => item.createdAt)
        .orderBy(({ item }) => item.id),
    [listItems, note.id],
  );

  /**
   * Appends a placeholder item and focuses it at once. The client picks the id, so the row
   * exists before the server answers; no pending state and no waiting for the created id.
   */
  const addItem = () => {
    const id = crypto.randomUUID();
    listItems.insert({
      checked: false,
      createdAt: new Date().toISOString(),
      id,
      name: 'New item',
      noteId: note.id,
    });
    setNewItemId(id);
  };

  return (
    <Card as='article' className={css.listCard}>
      <div className={css.cardHeader}>
        <h2>
          <SeamlessTextInput
            aria-label='Checklist title'
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
      {items.length === 0 ? <p className={css.emptyList}>No items yet.</p> : null}
      <ul className={css.items}>
        {items.map((item) => (
          <CheckedNoteItem
            autoFocus={item.id === newItemId}
            item={item}
            key={item.id}
            onEnter={addItem}
          />
        ))}
      </ul>
      <Btn
        aria-label='Add item'
        className={css.addItem}
        icon={<PlusIcon aria-hidden='true' />}
        onClick={addItem}
        size='sm'
        type='button'
        variant='outlineMain'
      >
        Add item
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
  // No local state, effects, pending flags, or manual rollback: `item` is already optimistic.
  const listItems = useListItemsCollection();
  const deleteItem = () => listItems.delete(item.id);

  return (
    <li className={css.item}>
      <input
        aria-label={`Mark ${item.name} as ${item.checked ? 'incomplete' : 'complete'}`}
        checked={item.checked}
        onChange={(event) => {
          const { checked } = event.currentTarget;
          listItems.update(item.id, (draft) => {
            draft.checked = checked;
          });
        }}
        type='checkbox'
      />
      <SeamlessTextInput
        autoFocus={autoFocus}
        aria-label='Checklist item'
        className={item.checked ? css.done : undefined}
        defaultValue={item.name}
        enterKeyHint='next'
        maxLength={240}
        onFocus={autoFocus ? (event) => event.currentTarget.select() : undefined}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            onEnter();
          } else if (
            (event.key === 'Backspace' || event.key === 'Delete') &&
            !event.currentTarget.value.trim()
          ) {
            event.preventDefault();
            deleteItem();
          }
        }}
        onBlur={(event) => {
          const name = event.currentTarget.value.trim();
          if (!name) event.currentTarget.value = item.name;
          else if (name !== item.name) {
            listItems.update(item.id, (draft) => {
              draft.name = name;
            });
          }
        }}
        required
      />
      <Btn
        aria-label={`Delete ${item.name}`}
        className={css.deleteItem}
        icon={<Trash2Icon aria-hidden='true' />}
        iconOnly
        onClick={deleteItem}
        size='sm'
        type='button'
        variant='ghostDanger'
      />
    </li>
  );
}
