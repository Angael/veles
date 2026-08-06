import { NumberField, type NumberFieldRootProps } from '@base-ui/react/number-field';
import clsx from 'clsx';
import { MinusIcon, PlusIcon } from 'lucide-react';
import css from './NumberInput.module.css';

type NumberInputProps = Omit<NumberFieldRootProps, 'className'> & {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
};

export function NumberInput({
  className,
  inputClassName,
  placeholder,
  ...props
}: NumberInputProps) {
  return (
    <NumberField.Root
      className={clsx(css.root, className)}
      data-required={props.required ? '' : undefined}
      {...props}
    >
      <NumberField.Group className={css.group}>
        <NumberField.Decrement
          aria-label='Decrease value'
          className={clsx(css.stepper, css.decrement)}
        >
          <MinusIcon aria-hidden='true' size={16} strokeWidth={1.8} />
        </NumberField.Decrement>

        <NumberField.Input
          className={clsx(css.input, inputClassName)}
          onChange={(event) => {
            event.currentTarget.value = normalizeDecimalSeparator(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (event.key === ',') {
              event.preventDefault();
              insertText(event.currentTarget, '.');
            }
          }}
          onPaste={(event) => {
            const pastedText = event.clipboardData.getData('text/plain');
            const normalizedText = normalizeDecimalSeparator(pastedText);

            if (normalizedText !== pastedText) {
              event.preventDefault();
              insertText(event.currentTarget, normalizedText);
            }
          }}
          placeholder={placeholder}
        />

        <NumberField.Increment
          aria-label='Increase value'
          className={clsx(css.stepper, css.increment)}
        >
          <PlusIcon aria-hidden='true' size={16} strokeWidth={1.8} />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}

function normalizeDecimalSeparator(value: string) {
  return value.replaceAll(',', '.');
}

/** Inserts normalized text at the caret and emits the input event Base UI uses to parse it. */
function insertText(input: HTMLInputElement, text: string) {
  const selectionStart = input.selectionStart ?? input.value.length;
  const selectionEnd = input.selectionEnd ?? selectionStart;

  input.setRangeText(text, selectionStart, selectionEnd, 'end');
  input.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      data: text,
      inputType: 'insertText',
    }),
  );
}
