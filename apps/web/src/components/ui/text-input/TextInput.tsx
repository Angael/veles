import { Input, type InputProps } from '@base-ui/react/input';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import css from './TextInput.module.css';

export type InputSize = 'sm' | 'md' | 'lg';

type TextInputProps = Omit<InputProps, 'className' | 'size'> & {
  className?: string;
  /** Visual size matching `Btn` heights; replaces the native character-width `size` attribute. */
  size?: InputSize;
  /** Compact control rendered inside the field's end edge, such as an icon button. */
  trailing?: ReactNode;
};

export function TextInput({ className, size = 'md', trailing, ...props }: TextInputProps) {
  const input = (
    <Input
      className={clsx(css.root, css[size], trailing !== undefined && css.withTrailing, className)}
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
