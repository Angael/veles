import { NumberField, type NumberFieldRootProps } from '@base-ui/react/number-field';
import clsx from 'clsx';
import { useState, type ComponentProps } from 'react';
import { flushSync } from 'react-dom';
import { MinusIcon, PlusIcon } from 'lucide-react';
import type { InputSize } from '@/components/ui/text-input/TextInput';
import {
  evaluateArithmeticExpression,
  isArithmeticExpression,
  isArithmeticOperator,
} from './arithmeticExpression';
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
  onValueChange,
  ...props
}: NumberInputProps) {
  // Typed arithmetic such as `10*2`; Base UI only accepts plain numbers, so it's held here until committed.
  const [expression, setExpression] = useState<string | null>(null);

  /** Replaces a pending expression with its result so Base UI parses, clamps and commits it like typed input. */
  function commitExpression(input: HTMLInputElement) {
    if (expression === null) {
      return;
    }

    const result = evaluateArithmeticExpression(expression);

    // Flush so Base UI's own blur/submit handling already sees the result.
    flushSync(() => {
      if (result === null) {
        setExpression(null);
        return;
      }

      const clamped = Math.min(Math.max(result, props.min ?? -Infinity), props.max ?? Infinity);
      replaceText(input, String(clamped));
    });
  }

  return (
    <NumberField.Root
      allowWheelScrub
      className={clsx(css.root, css[size], className)}
      data-required={props.required ? '' : undefined}
      step={stepperStep ?? 'any'}
      onValueChange={(value, eventDetails) => {
        setExpression(null);
        onValueChange?.(value, eventDetails);
      }}
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
          {...(expression !== null && { value: expression })}
          onBlurCapture={(event) => commitExpression(event.currentTarget)}
          onChange={(event) => {
            const input = event.currentTarget;
            input.value = normalizeDecimalSeparator(input.value);

            if (isArithmeticExpression(input.value)) {
              event.preventBaseUIHandler();
              setExpression(input.value);
            } else {
              setExpression(null);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === ',') {
              event.preventDefault();
              insertText(event.currentTarget, '.');
            } else if (isArithmeticOperator(event.key) && !event.ctrlKey && !event.metaKey) {
              // Base UI blocks operator keys, so insert them ourselves.
              event.preventDefault();
              insertText(event.currentTarget, event.key);
            } else if (event.key === 'Enter') {
              commitExpression(event.currentTarget);
            }
          }}
          onPaste={(event) => {
            const pastedText = event.clipboardData.getData('text/plain');
            const normalizedText = normalizeDecimalSeparator(pastedText);

            if (normalizedText !== pastedText || /[-+*/]/.test(normalizedText)) {
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

  setText(input, text, selectionStart, selectionEnd);
}

function replaceText(input: HTMLInputElement, text: string) {
  setText(input, text, 0, input.value.length);
}

function setText(input: HTMLInputElement, text: string, start: number, end: number) {
  input.setRangeText(text, start, end, 'end');
  input.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      data: text,
      inputType: 'insertText',
    }),
  );
}
