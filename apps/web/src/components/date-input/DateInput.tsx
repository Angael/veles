import clsx from 'clsx';
import { CalendarDaysIcon } from 'lucide-react';
import { type ComponentPropsWithoutRef, useState } from 'react';
import { TextInput } from '@/components/text-input/TextInput';
import css from './DateInput.module.css';

type DateInputProps = Omit<ComponentPropsWithoutRef<typeof TextInput>, 'type'>;

export function DateInput({ className, ...props }: DateInputProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    getStringValue(props.defaultValue),
  );
  const value = props.value === undefined ? uncontrolledValue : getStringValue(props.value);

  return (
    <span className={clsx(css.root, className)}>
      <span aria-hidden='true' className={clsx(css.display, !value && css.placeholder)}>
        {formatDate(value)}
      </span>
      <CalendarDaysIcon aria-hidden='true' className={css.icon} />
      <TextInput
        {...props}
        className={css.input}
        lang='pl-PL'
        onChange={(event) => {
          setUncontrolledValue(event.currentTarget.value);
          props.onChange?.(event);
        }}
        type='date'
      />
    </span>
  );
}

function getStringValue(value: DateInputProps['value'] | DateInputProps['defaultValue']) {
  return typeof value === 'string' ? value : '';
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return 'DD/MM/YYYY';
  }

  return `${day}/${month}/${year}`;
}
