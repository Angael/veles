import clsx from 'clsx';
import { XIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import dock from '@/components/ui/mobile-dock/MobileDock.module.css';
import css from './SelectionBar.module.css';

type SelectionBarProps = {
  'aria-label': string;
  /** `SelectionBarAction`s, secondary first and the primary action last. */
  children: ReactNode;
  count: number;
  onClear: () => void;
};

/**
 * Toolbar for bulk actions on selected items. Render it instead of the page's FloatingButton
 * while a selection exists: desktop keeps the button's spot, phones replace the mobile navbar
 * in the bottom dock.
 */
export function SelectionBar({
  'aria-label': ariaLabel,
  children,
  count,
  onClear,
}: SelectionBarProps) {
  return (
    // `floatingButton` keeps AppFrame's bottom clearance so the swap doesn't resize the page;
    // `selectionBar` hides the mobile navbar while this bar owns the dock.
    <div
      aria-label={ariaLabel}
      className={clsx(dock.dock, css.bar, 'floatingButton', 'selectionBar')}
      role='toolbar'
    >
      <Btn
        aria-label='Clear selection'
        icon={<XIcon aria-hidden='true' />}
        iconOnly
        onClick={onClear}
        radius='pill'
        variant='ghost'
      />
      <span aria-live='polite' className={css.count}>
        {count} selected
      </span>
      {children}
    </div>
  );
}

type SelectionBarActionProps = Omit<
  ComponentProps<typeof Btn>,
  'children' | 'className' | 'icon' | 'iconOnly' | 'radius' | 'size'
> & {
  icon: ReactNode;
  label: string;
  /** Keeps its label on phones; secondary actions collapse to icons there. */
  primary?: boolean;
};

export function SelectionBarAction({
  icon,
  label,
  primary = false,
  variant = primary ? 'main' : 'ghost',
  ...props
}: SelectionBarActionProps) {
  return (
    <Btn
      aria-label={primary ? undefined : label}
      className={primary ? undefined : css.collapsible}
      icon={icon}
      radius='pill'
      variant={variant}
      {...props}
    >
      {primary ? label : <span className={css.label}>{label}</span>}
    </Btn>
  );
}
