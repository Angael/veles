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
 * in the bottom dock with labeled items, like the navbar's.
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
      <Btn
        aria-label={t({ en: 'Clear selection', pl: 'Wyczyść zaznaczenie' })}
        className={clsx(css.action, css.clear)}
        icon={
          <>
            <XIcon aria-hidden='true' />
            {/* Phones show the count here, as the full text doesn't fit beside labeled items. */}
            <span aria-hidden='true' className={css.badge}>
              {count}
            </span>
          </>
        }
        onClick={onClear}
        radius='pill'
        variant='ghost'
      >
        <span className={css.label}>{t({ en: 'Clear', pl: 'Odznacz' })}</span>
      </Btn>
      <span aria-live='polite' className={css.count}>
        {t({ en: `${count} selected`, pl: `Zaznaczono: ${count}` })}
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
  /** Filled main button; secondary actions are ghost. */
  primary?: boolean;
};

/** Icon and visible label; phones stack them like the mobile navbar so every icon is named. */
export function SelectionBarAction({
  icon,
  label,
  primary = false,
  variant = primary ? 'main' : 'ghost',
  ...props
}: SelectionBarActionProps) {
  return (
    <Btn
      className={clsx(css.action, primary && css.primary)}
      icon={icon}
      radius='pill'
      variant={variant}
      {...props}
    >
      <span className={css.label}>{label}</span>
    </Btn>
  );
}
