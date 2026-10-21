import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { v7 as uuidv7 } from 'uuid';
import { Btn } from '@/components/ui/btn/Btn';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
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
 * Local checklist editor for a note that does not exist yet. Enter adds a row below and Backspace
 * on an empty row removes it, like the saved checklist card, but nothing is sent until submit.
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

  // Rows are added or removed by the parent's state, so focus moves after that render.
  useEffect(() => {
    const id = focusIdRef.current;
    if (!id) return;
    focusIdRef.current = null;
    listRef.current?.querySelector<HTMLInputElement>(`[data-item-id="${id}"]`)?.focus();
  });

  const addItemAfter = (index: number) => {
    const item = newDraftItem();
    focusIdRef.current = item.id;
    onItemsChange([...items.slice(0, index + 1), item, ...items.slice(index + 1)]);
  };

  const removeItem = (index: number) => {
    focusIdRef.current = items[index - 1]?.id ?? items[index + 1]?.id ?? null;
    onItemsChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <>
      <ul className={css.items} ref={listRef}>
        {items.map((item, index) => (
          <li className={css.item} key={item.id}>
            <input aria-hidden='true' disabled tabIndex={-1} type='checkbox' />
            <SeamlessTextInput
              aria-label={t({ en: 'Checklist item', pl: 'Pozycja listy' })}
              data-draft-body
              data-item-id={item.id}
              enterKeyHint='next'
              maxLength={240}
              onChange={(event) => {
                const name = event.currentTarget.value;
                onItemsChange(items.map((row) => (row.id === item.id ? { ...row, name } : row)));
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  addItemAfter(index);
                } else if (
                  (event.key === 'Backspace' || event.key === 'Delete') &&
                  !event.currentTarget.value &&
                  items.length > 1
                ) {
                  event.preventDefault();
                  removeItem(index);
                }
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
        onClick={() => addItemAfter(items.length - 1)}
        size='sm'
        type='button'
        variant='outlineMain'
      >
        {t({ en: 'Add item', pl: 'Dodaj pozycję' })}
      </Btn>
    </>
  );
}
