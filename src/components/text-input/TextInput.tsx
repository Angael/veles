import { Input, type InputProps } from '@base-ui/react/input';
import clsx from 'clsx';
import css from './TextInput.module.css';

type TextInputProps = Omit<InputProps, 'className'> & {
  className?: string;
};

export function TextInput({ className, ...props }: TextInputProps) {
  return <Input className={clsx(css.root, className)} {...props} />;
}
