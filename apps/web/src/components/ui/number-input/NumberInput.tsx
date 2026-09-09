import { NumberField, type NumberFieldRootProps } from '@base-ui/react/number-field';
import clsx from 'clsx';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { useRef } from 'react';
import css from './NumberInput.module.css';

type NumberInputProps = Omit<NumberFieldRootProps, 'className' | 'step'> & {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  stepperStep?: number;
};

export function NumberInput({
  className,
  inputClassName,
  placeholder,
  stepperStep,
  ...props
}: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <NumberField.Root
      allowWheelScrub
      className={clsx(css.root, className)}
      data-required={props.required ? '' : undefined}
      step='any'
      smallStep={stepperStep}
      {...props}
    >
      <NumberField.Group className={css.group}>
        {stepperStep === undefined ? (
          <NumberField.Decrement
            aria-label='Decrease value'
            className={clsx(css.stepper, css.decrement)}
          >
            <MinusIcon aria-hidden='true' size={16} strokeWidth={1.8} />
          </NumberField.Decrement>
        ) : (
          <button
            aria-label='Decrease value'
            className={clsx(css.stepper, css.decrement)}
            onClick={() => stepInput(inputRef.current, -1)}
            type='button'
          >
            <MinusIcon aria-hidden='true' size={16} strokeWidth={1.8} />
          </button>
        )}

        <NumberField.Input
          ref={inputRef}
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

        {stepperStep === undefined ? (
          <NumberField.Increment
            aria-label='Increase value'
            className={clsx(css.stepper, css.increment)}
          >
            <PlusIcon aria-hidden='true' size={16} strokeWidth={1.8} />
          </NumberField.Increment>
        ) : (
          <button
            aria-label='Increase value'
            className={clsx(css.stepper, css.increment)}
            onClick={() => stepInput(inputRef.current, 1)}
            type='button'
          >
            <PlusIcon aria-hidden='true' size={16} strokeWidth={1.8} />
          </button>
        )}
      </NumberField.Group>
    </NumberField.Root>
  );
}

/** Uses Base UI's small-step keyboard path while preserving unrestricted decimal validation. */
function stepInput(input: HTMLInputElement | null, direction: -1 | 1) {
  input?.dispatchEvent(
    new KeyboardEvent('keydown', {
      altKey: true,
      bubbles: true,
      key: direction === 1 ? 'ArrowUp' : 'ArrowDown',
    }),
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
