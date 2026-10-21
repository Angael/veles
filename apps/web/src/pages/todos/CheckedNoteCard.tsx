import { eq, useLiveQuery } from '@tanstack/react-db';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { v7 as uuidv7 } from 'uuid';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { listItemsCollection, useListItemsCollection } from './listItems.collection';
import { NoteActions } from './NoteActions';
import { NoteConflictNotice } from './NoteConflictNotice';
import type { NoteListItem, NoteSummary } from './notes.api';
import { useNoteDraft } from './useNoteDraft';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function CheckedNoteCard({ note }: { note: NoteSummary }) {
  const { t } = useI18n();
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const listItems = useListItemsCollection();
  const noteDraft = useNoteDraft(note);
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
   * Appends a placeholder item and focuses it at once. The client picks the id, so the row
   * exists before the server answers; no pending state and no waiting for the created id.
   */
  const addItem = () => {
    const id = uuidv7();
    listItems.insert({
      checked: false,
      createdAt: new Date().toISOString(),
      id,
      name: t({ en: 'New item', pl: 'Nowa pozycja' }),
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
            enterKeyHint='next'
            maxLength={160}
            onBlur={noteDraft.saveTitle}
            onChange={(event) => {
              const title = event.currentTarget.value;
              noteDraft.setDraft((current) => ({ ...current, title }));
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                addItem();
              }
            }}
            required
            value={noteDraft.draft.title}
          />
        </h2>
        <NoteActions note={note} />
      </div>
      <NoteConflictNotice noteDraft={noteDraft} />
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
            ? t({
                en: `Mark ${item.name} as incomplete`,
                pl: `Oznacz ${item.name} jako niezrobione`,
              })
            : t({ en: `Mark ${item.name} as complete`, pl: `Oznacz ${item.name} jako zrobione` })
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
        aria-label={t({ en: `Delete ${item.name}`, pl: `Usuń: ${item.name}` })}
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
