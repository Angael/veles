import { NumberField, type NumberFieldRootProps } from '@base-ui/react/number-field';
import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { MinusIcon, PlusIcon } from 'lucide-react';
import type { InputSize } from '@/components/ui/text-input/TextInput';
import css from './NumberInput.module.css';

type NumberInputProps = Omit<NumberFieldRootProps, 'className' | 'step'> & {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  enterKeyHint?: ComponentProps<'input'>['enterKeyHint'];
  /** Visual size matching `Btn` heights. */
  size?: InputSize;
  /** Stepper amount; also limits typed precision to this step. Defaults to 1 with any precision. */
  stepperStep?: number;
};

export function NumberInput({
  className,
  inputClassName,
  enterKeyHint,
  placeholder,
  size = 'md',
  stepperStep,
  ...props
}: NumberInputProps) {
  return (
    <NumberField.Root
      allowWheelScrub
      className={clsx(css.root, css[size], className)}
      data-required={props.required ? '' : undefined}
      step={stepperStep ?? 'any'}
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
          enterKeyHint={enterKeyHint}
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
