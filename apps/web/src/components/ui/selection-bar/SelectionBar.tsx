import clsx from 'clsx';
import { XIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import dock from '@/components/ui/mobile-dock/MobileDock.module.css';
import css from './SelectionBar.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

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
 * in the bottom dock. It is a two-tier tray: the count, Clear, and the primary action share the
 * top row; secondary actions get equal, labeled cells in the row below, so nothing is squeezed.
 */
export function SelectionBar({
  'aria-label': ariaLabel,
  children,
  count,
  onClear,
}: SelectionBarProps) {
  const { t } = useI18n();

  return (
    // `floatingButton` keeps AppFrame's bottom clearance so the swap doesn't resize the page;
    // `selectionBar` hides the mobile navbar while this bar owns the dock.
    <div
      aria-label={ariaLabel}
      className={clsx(dock.dock, css.bar, 'floatingButton', 'selectionBar')}
      role='toolbar'
    >
      <div className={css.summary}>
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
        <span aria-live='polite' className={css.count}>
          {t({ en: `${count} selected`, pl: `Zaznaczono: ${count}` })}
        </span>
      </div>
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
  /** Shorter label for phones, where secondary actions share the tray's width; `label` stays the accessible name. */
  phoneLabel?: string;
  /** Filled main button in the tray's top row; secondary actions are ghost cells below. */
  primary?: boolean;
};

/** Icon and visible label; secondary actions stack them so every icon is named in an even cell. */
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
      className={clsx(css.action, primary && css.primary)}
      icon={icon}
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
