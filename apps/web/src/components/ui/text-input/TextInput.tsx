import { Input, type InputProps } from '@base-ui/react/input';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import css from './TextInput.module.css';

type TextInputProps = Omit<InputProps, 'className'> & {
  className?: string;
  /** Compact control rendered inside the field's end edge, such as an icon button. */
  trailing?: ReactNode;
};

export function TextInput({ className, trailing, ...props }: TextInputProps) {
  const input = (
    <Input
      className={clsx(css.root, trailing !== undefined && css.withTrailing, className)}
      data-required={props.required ? '' : undefined}
      {...props}
    />
  );

  if (trailing === undefined) return input;

  return (
    <div className={css.field}>
      {input}
      <div className={css.trailing}>{trailing}</div>
    </div>
  );
}
