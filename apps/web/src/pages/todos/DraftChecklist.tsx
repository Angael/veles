import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { v7 as uuidv7 } from 'uuid';
import { Btn } from '@/components/ui/btn/Btn';
import { ChecklistItemInput, focusField } from './ChecklistItemInput';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** An unsaved checklist row; the id only keys React rows and focus, the server assigns its own. */
export type DraftItem = { id: string; name: string };

export function newDraftItem(name = ''): DraftItem {
  return { id: uuidv7(), name };
}

/** Splits text note lines into draft rows, matching the server's note to checklist conversion. */
export function linesToDraftItems(content: string) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => newDraftItem(line));
}

/**
 * Local checklist editor for a note that does not exist yet. Enter goes to the next row (adding one
 * on the last row) and Backspace on an empty row removes it, like the saved checklist card, but
 * nothing is sent until submit.
 */
export function DraftChecklist({
  items,
  onItemsChange,
}: {
  items: DraftItem[];
  onItemsChange: (items: DraftItem[]) => void;
}) {
  const { t } = useI18n();
  const listRef = useRef<HTMLUListElement>(null);
  const focusIdRef = useRef<string | null>(null);

  const itemField = (id: string | undefined) =>
    id ? listRef.current?.querySelector<HTMLTextAreaElement>(`[data-item-id="${id}"]`) : null;

  // A new row exists only after the parent's state renders, so it takes focus after that render.
  useEffect(() => {
    const id = focusIdRef.current;
    if (!id) return;
    focusIdRef.current = null;
    focusField(itemField(id), 'end');
  });

  const goToNextItem = (index: number) => {
    const next = items[index + 1];
    if (next) {
      focusField(itemField(next.id), 'end');
      return;
    }
    const item = newDraftItem();
    focusIdRef.current = item.id;
    onItemsChange([...items, item]);
  };

  /** Moves focus to a neighbor before the row unmounts, so the mobile keyboard stays open. */
  const removeItem = (index: number, direction: 'previous' | 'next' = 'previous') => {
    const previous = items[index - 1];
    const next = items[index + 1];
    if (itemField(items[index]?.id) === document.activeElement) {
      if (direction === 'previous' && previous) focusField(itemField(previous.id), 'end');
      else if (next) focusField(itemField(next.id), 0);
      else if (previous) focusField(itemField(previous.id), 'end');
    }
    onItemsChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  /** Backspace at the start of a row joins its text onto the previous row. */
  const mergeIntoPrevious = (index: number, text: string) => {
    const previous = items[index - 1];
    const field = itemField(previous?.id);
    if (!previous || !field || previous.name.length + text.length > 240) return;
    // Set the joined text first: React then sees no change and keeps the caret at the join.
    field.value = previous.name + text;
    focusField(field, previous.name.length);
    onItemsChange(
      items.flatMap((row, rowIndex) => {
        if (rowIndex === index) return [];
        return rowIndex === index - 1 ? [{ ...row, name: row.name + text }] : [row];
      }),
    );
  };

  return (
    <>
      <ul className={css.items} ref={listRef}>
        {items.map((item, index) => (
          <li className={css.item} key={item.id}>
            <input aria-hidden='true' disabled tabIndex={-1} type='checkbox' />
            <ChecklistItemInput
              aria-label={t({ en: 'Checklist item', pl: 'Pozycja listy' })}
              data-draft-body
              data-item-id={item.id}
              onChange={(event) => {
                const name = event.currentTarget.value;
                onItemsChange(items.map((row) => (row.id === item.id ? { ...row, name } : row)));
              }}
              onEnter={() => goToNextItem(index)}
              onMergeIntoPrevious={index > 0 ? (text) => mergeIntoPrevious(index, text) : undefined}
              onRemoveEmpty={(direction) => {
                if (items.length > 1) removeItem(index, direction);
              }}
              placeholder={t({ en: 'List item', pl: 'Pozycja listy' })}
              value={item.name}
            />
            <Btn
              aria-label={t({ en: 'Delete item', pl: 'Usuń pozycję' })}
              className={css.deleteItem}
              icon={<Trash2Icon aria-hidden='true' />}
              iconOnly
              onClick={() => removeItem(index)}
              // Keeps focus in the edited row, so the mobile keyboard does not close and reopen.
              onMouseDown={(event) => event.preventDefault()}
              size='sm'
              type='button'
              variant='ghostDanger'
            />
          </li>
        ))}
      </ul>
      <Btn
        className={css.addItem}
        icon={<PlusIcon aria-hidden='true' />}
        onClick={() => goToNextItem(items.length - 1)}
        // Keeps focus in the edited row, so the mobile keyboard does not close and reopen.
        onMouseDown={(event) => event.preventDefault()}
        size='sm'
        type='button'
        variant='outlineMain'
      >
        {t({ en: 'Add item', pl: 'Dodaj pozycję' })}
      </Btn>
    </>
  );
}
