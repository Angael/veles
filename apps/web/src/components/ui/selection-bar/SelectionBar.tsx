import clsx from 'clsx';
import { XIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import dock from '@/components/ui/mobile-dock/MobileDock.module.css';
import css from './SelectionBar.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type SelectionBarProps = {
  'aria-label': string;
  /** Secondary `SelectionBarAction`s, grouped in one pill. */
  children: ReactNode;
  count: number;
  onClear: () => void;
  /** The main `SelectionBarAction` (with `primary`); it gets its own tile beside the pill. */
  primary: ReactNode;
};

/**
 * Toolbar for bulk actions on selected items. Render it instead of the page's FloatingButton
 * while a selection exists. It splits into three pieces so no group is crowded: a count chip
 * with Clear, a pill of secondary actions, and a separate tile for the main action. Desktop keeps
 * the button's spot; phones replace the mobile navbar in the bottom dock, with the chip above it.
 */
export function SelectionBar({
  'aria-label': ariaLabel,
  children,
  count,
  onClear,
  primary,
}: SelectionBarProps) {
  const { t } = useI18n();

  return (
    // `floatingButton` keeps AppFrame's bottom clearance so the swap doesn't resize the page;
    // `selectionBar` hides the mobile navbar while this bar owns the dock.
    <div
      aria-label={ariaLabel}
      className={clsx(css.bar, 'floatingButton', 'selectionBar')}
      role='toolbar'
    >
      <div className={clsx(dock.surface, css.status)}>
        <span aria-live='polite' className={css.count}>
          {t({ en: `${count} selected`, pl: `Zaznaczono: ${count}` })}
        </span>
        <Btn
          aria-label={t({ en: 'Clear selection', pl: 'Wyczyść zaznaczenie' })}
          className={css.clear}
          icon={<XIcon aria-hidden='true' />}
          iconOnly
          onClick={onClear}
          radius='pill'
          size='sm'
          variant='ghost'
        />
      </div>
      <div className={clsx(dock.surface, css.actions)}>{children}</div>
      <div className={css.primary}>{primary}</div>
    </div>
  );
}

type SelectionBarActionProps = Omit<
  ComponentProps<typeof Btn>,
  'children' | 'className' | 'icon' | 'iconOnly' | 'radius' | 'size'
> & {
  icon: ReactNode;
  label: string;
  /** Shorter label for phones, where every item shares the navbar's width; `label` stays the accessible name. */
  phoneLabel?: string;
  /** Filled main button for the bar's `primary` slot; secondary actions are ghost. */
  primary?: boolean;
};

/** Icon and visible label; phones stack them like the mobile navbar so every icon is named. */
export function SelectionBarAction({
  icon,
  label,
  phoneLabel,
  primary = false,
  variant = primary ? 'main' : 'ghost',
  ...props
}: SelectionBarActionProps) {
  return (
    <Btn
      aria-label={phoneLabel ? label : undefined}
      className={css.action}
      icon={icon}
      radius='pill'
      variant={variant}
      {...props}
    >
      <span className={clsx(css.label, phoneLabel && css.desktopOnly)}>{label}</span>
      {phoneLabel ? (
        <span aria-hidden='true' className={clsx(css.label, css.phoneOnly)}>
          {phoneLabel}
        </span>
      ) : null}
    </Btn>
  );
}
