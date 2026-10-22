import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import css from './TodosPage.module.css';

type ChecklistItemInputProps = Omit<
  ComponentProps<typeof SeamlessTextarea>,
  'enterKeyHint' | 'maxLength' | 'onKeyDown' | 'rows'
> & {
  /** Enter: go to the next item. */
  onEnter: () => void;
  /** Backspace or Delete on an empty item: remove it and focus a neighbor in that direction. */
  onRemoveEmpty: (direction: 'previous' | 'next') => void;
  /** Backspace at the start of a filled item: join its text onto the previous item. */
  onMergeIntoPrevious?: (text: string) => void;
};

/**
 * Checklist item name field. It wraps long names onto more lines, but names stay single-line:
 * Enter moves to the next item, and pasted line breaks become spaces, like the server does.
 */
export function ChecklistItemInput({
  className,
  onChange,
  onEnter,
  onMergeIntoPrevious,
  onRemoveEmpty,
  ...props
}: ChecklistItemInputProps) {
  return (
    <SeamlessTextarea
      {...props}
      className={clsx(css.itemName, className)}
      enterKeyHint='next'
      maxLength={240}
      onChange={(event) => {
        const field = event.currentTarget;
        if (/[\r\n]/.test(field.value)) {
          // Same length, so the caret stays where it was.
          const caret = field.selectionStart;
          field.value = field.value.replace(/[\r\n]/g, ' ');
          field.setSelectionRange(caret, caret);
        }
        onChange?.(event);
      }}
      onKeyDown={(event) => {
        const field = event.currentTarget;
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
          event.preventDefault();
          onEnter();
        } else if ((event.key === 'Backspace' || event.key === 'Delete') && !field.value.trim()) {
          event.preventDefault();
          onRemoveEmpty(event.key === 'Backspace' ? 'previous' : 'next');
        } else if (
          event.key === 'Backspace' &&
          onMergeIntoPrevious &&
          field.selectionStart === 0 &&
          field.selectionEnd === 0
        ) {
          event.preventDefault();
          onMergeIntoPrevious(field.value);
        }
      }}
      rows={1}
    />
  );
}

/**
 * Focuses a field with the caret at `caret` without the browser's own scroll, then scrolls only
 * if the field is outside the visible viewport. Moving focus straight from field to field keeps
 * the mobile keyboard open, so the page does not jump while it hides and opens again.
 */
export function focusField(
  field: HTMLInputElement | HTMLTextAreaElement | null | undefined,
  caret: 'end' | number,
) {
  if (!field) return;
  field.focus({ preventScroll: true });
  const position = caret === 'end' ? field.value.length : caret;
  field.setSelectionRange(position, position);
  const viewport = window.visualViewport;
  const top = viewport?.offsetTop ?? 0;
  const bottom = top + (viewport?.height ?? window.innerHeight);
  const rect = field.getBoundingClientRect();
  if (rect.top < top || rect.bottom > bottom) field.scrollIntoView({ block: 'nearest' });
}
