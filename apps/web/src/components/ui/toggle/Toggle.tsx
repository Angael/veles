import { Switch, type SwitchRootProps } from '@base-ui/react/switch';
import clsx from 'clsx';
import css from './Toggle.module.css';

type ToggleProps = Omit<SwitchRootProps, 'className'> & {
  className?: string;
};

export function Toggle({ className, ...props }: ToggleProps) {
  return (
    <Switch.Root className={clsx(css.root, className)} {...props}>
      <Switch.Thumb className={css.thumb} />
    </Switch.Root>
  );
}
