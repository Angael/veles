import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import { TextInput } from '@/components/text-input/TextInput';
import css from './DateInput.module.css';

type DateInputProps = Omit<ComponentPropsWithoutRef<typeof TextInput>, 'type'>;

export function DateInput({ className, ...props }: DateInputProps) {
  return <TextInput className={clsx(css.root, className)} type='date' {...props} />;
}
