import { eq, useLiveQuery } from '@tanstack/react-db';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { v7 as uuidv7 } from 'uuid';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { listItemsCollection, useListItemsCollection } from './listItems.collection';
import { NoteActions } from './NoteActions';
import type { NoteListItem, NoteSummary } from './notes.api';
import { useUpdateNoteMutation } from './notes.query';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function CheckedNoteCard({ note }: { note: NoteSummary }) {
  const { t } = useI18n();
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const listItems = useListItemsCollection();
  const updateNote = useUpdateNoteMutation();
  // Live query: re-runs incrementally whenever a row in the collection changes, including
  // optimistic writes from this card, another card, or a background refetch.
  // No dependency array: TanStack DB derives the query identity, including `note.id`, from the query.
  const { data: items } = useLiveQuery({
    query: (q) =>
      q
        .from({ item: listItemsCollection })
        .where(({ item }) => eq(item.noteId, note.id))
        .orderBy(({ item }) => item.createdAt)
        .orderBy(({ item }) => item.id),
  });

  /**
   * Appends an empty item and focuses it at once. The client picks the id, so the row
   * exists before the server answers; no pending state and no waiting for the created id.
   */
  const addItem = () => {
    const id = uuidv7();
    listItems.insert({
      checked: false,
      createdAt: new Date().toISOString(),
      id,
      name: '',
      noteId: note.id,
    });
    setNewItemId(id);
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
      {items.length === 0 ? (
        <p className={css.emptyList}>{t({ en: 'No items yet.', pl: 'Brak pozycji.' })}</p>
      ) : null}
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
        aria-label={t({ en: 'Add item', pl: 'Dodaj pozycję' })}
        className={css.addItem}
        icon={<PlusIcon aria-hidden='true' />}
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
  // No local state, effects, pending flags, or manual rollback: `item` is already optimistic.
  const listItems = useListItemsCollection();
  const deleteItem = () => listItems.delete(item.id);

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
      <SeamlessTextInput
        autoFocus={autoFocus}
        aria-label={t({ en: 'Checklist item', pl: 'Pozycja listy' })}
        className={item.checked ? css.done : undefined}
        defaultValue={item.name}
        enterKeyHint='next'
        maxLength={240}
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
          if (name !== item.name) {
            listItems.update(item.id, (draft) => {
              draft.name = name;
            });
          }
        }}
        placeholder={t({ en: 'List item', pl: 'Pozycja listy' })}
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
        onClick={deleteItem}
        size='sm'
        type='button'
        variant='ghostDanger'
      />
    </li>
  );
}
