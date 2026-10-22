import { eq, useLiveQuery } from '@tanstack/react-db';
import { PlusIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { v7 as uuidv7 } from 'uuid';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { CheckedNoteItem } from './CheckedNoteItem';
import { focusField } from './ChecklistItemInput';
import { listItemsCollection, useListItemsCollection } from './listItems.collection';
import { NoteActions } from './NoteActions';
import type { NoteSummary } from './notes.api';
import { useUpdateNoteMutation } from './notes.query';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function CheckedNoteCard({ note }: { note: NoteSummary }) {
  const { t } = useI18n();
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
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

  const itemField = (id: string | undefined) =>
    id ? listRef.current?.querySelector<HTMLTextAreaElement>(`[data-item-id="${id}"]`) : null;

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

  /** Enter goes to the next item; on the last item it adds a new one, as items sort by creation. */
  const goToNextItem = (index: number) => {
    const next = items[index + 1];
    if (next) focusField(itemField(next.id), 'end');
    else addItem();
  };

  /**
   * Deletes an item. When its field has focus, focus first moves to a neighbor (or the title), so
   * focus never drops to the page and the mobile keyboard stays open.
   */
  const removeItem = (index: number, direction: 'previous' | 'next' = 'previous') => {
    const item = items[index];
    if (!item) return;
    const field = itemField(item.id);
    // Moving focus away blurs the field; the flag stops its blur save from racing the delete.
    field?.setAttribute('data-removed', '');
    if (field === document.activeElement) {
      const previous = items[index - 1];
      const next = items[index + 1];
      if (direction === 'previous' && previous) focusField(itemField(previous.id), 'end');
      else if (next) focusField(itemField(next.id), 0);
      else if (previous) focusField(itemField(previous.id), 'end');
      else focusField(titleRef.current, 'end');
    }
    listItems.delete(item.id);
  };

  /** Backspace at the start of an item joins its text onto the previous item, like a text editor. */
  const mergeIntoPrevious = (index: number, text: string) => {
    const item = items[index];
    const previous = items[index - 1];
    const field = itemField(previous?.id);
    if (!item || !previous || !field || field.value.length + text.length > 240) return;
    itemField(item.id)?.setAttribute('data-removed', '');
    const caret = field.value.length;
    const name = field.value + text;
    field.value = name;
    focusField(field, caret);
    listItems.update(previous.id, (draft) => {
      draft.name = name.trim();
    });
    listItems.delete(item.id);
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
            ref={titleRef}
            required
          />
        </h2>
        <NoteActions note={note} />
      </div>
      {items.length === 0 ? (
        <p className={css.emptyList}>{t({ en: 'No items yet.', pl: 'Brak pozycji.' })}</p>
      ) : null}
      <ul className={css.items} ref={listRef}>
        {items.map((item, index) => (
          <CheckedNoteItem
            autoFocus={item.id === newItemId}
            item={item}
            key={item.id}
            onEnter={() => goToNextItem(index)}
            onMergeIntoPrevious={index > 0 ? (text) => mergeIntoPrevious(index, text) : undefined}
            onRemove={(direction) => removeItem(index, direction)}
          />
        ))}
      </ul>
      <Btn
        aria-label={t({ en: 'Add item', pl: 'Dodaj pozycję' })}
        className={css.addItem}
        icon={<PlusIcon aria-hidden='true' />}
        onClick={addItem}
        // Keeps focus in the edited item, so the mobile keyboard does not close and reopen.
        onMouseDown={(event) => event.preventDefault()}
        size='sm'
        type='button'
        variant='outlineMain'
      >
        {t({ en: 'Add item', pl: 'Dodaj pozycję' })}
      </Btn>
    </Card>
  );
}
