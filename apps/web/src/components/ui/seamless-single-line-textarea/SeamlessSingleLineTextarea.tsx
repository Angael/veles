import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import css from './SeamlessSingleLineTextarea.module.css';

type SeamlessSingleLineTextareaProps = Omit<ComponentProps<typeof SeamlessTextarea>, 'rows'> & {
  /** Runs on Enter, which never inserts a line break here. */
  onEnter?: (field: HTMLTextAreaElement) => void;
};

/**
 * Text field for a single-line value that wraps visually, so long text stays readable.
 * Enter does not add a line break, and pasted line breaks become spaces before `onChange` runs.
 */
export function SeamlessSingleLineTextarea({
  className,
  onChange,
  onEnter,
  onKeyDown,
  ...props
}: SeamlessSingleLineTextareaProps) {
  return (
    <SeamlessTextarea
      {...props}
      className={clsx(css.root, className)}
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
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
          event.preventDefault();
          onEnter?.(event.currentTarget);
        }
        onKeyDown?.(event);
      }}
      rows={1}
    />
  );
}
