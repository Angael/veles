import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import clsx from 'clsx';
import { CheckIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import css from './Checkbox.module.css';

type CheckboxProps = Omit<ComponentProps<typeof BaseCheckbox.Root>, 'className' | 'children'> & {
  className?: string;
};

/** Square checkbox with a check mark; wrap it in a `<label>` or give it an `aria-label`. */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root className={clsx(css.checkbox, className)} {...props}>
      <BaseCheckbox.Indicator className={css.indicator}>
        <CheckIcon aria-hidden='true' strokeWidth={3} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
