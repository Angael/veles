import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { TextInput } from '@/components/ui/text-input/TextInput';
import css from './DateInput.module.css';

type DateInputProps = Omit<ComponentProps<typeof TextInput>, 'type'>;

export function DateInput({ className, ...props }: DateInputProps) {
  return <TextInput className={clsx(css.root, className)} type='date' {...props} />;
}
