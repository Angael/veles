import clsx from 'clsx';
import { ChevronUpIcon, XIcon } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { ComponentProps, KeyboardEvent, ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import dock from '@/components/ui/mobile-dock/MobileDock.module.css';
import css from './SelectionBar.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type SelectionBarProps = {
  'aria-label': string;
  /** Secondary `SelectionBarAction`s. Desktop shows them inline; phones list them under More. */
  children: ReactNode;
  count: number;
  onClear: () => void;
  /** The main `SelectionBarAction`, always visible at the end of the bar. */
  primary: ReactNode;
};

/**
 * Toolbar for bulk actions on selected items. Render it instead of the page's FloatingButton
 * while a selection exists: desktop keeps the button's spot with every action inline. Phones
 * replace the mobile navbar with one calm row (clear, count, More, primary action) and open
 * the secondary actions in a panel above the dock, so the navbar-sized slot never overfills.
 */
export function SelectionBar({
  'aria-label': ariaLabel,
  children,
  count,
  onClear,
  primary,
}: SelectionBarProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const moreId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Portaled dialogs bubble React key events through here; only react to keys inside the bar.
  function closeOnEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !expanded) return;
    if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return;
    event.stopPropagation();
    setExpanded(false);
    toggleRef.current?.focus();
  }

  return (
    // `floatingButton` keeps AppFrame's bottom clearance so the swap doesn't resize the page;
    // `selectionBar` hides the mobile navbar while this bar owns the dock.
    <div
      aria-label={ariaLabel}
      className={clsx(dock.dock, css.bar, 'floatingButton', 'selectionBar')}
      data-expanded={expanded || undefined}
      onKeyDown={closeOnEscape}
      role='toolbar'
    >
      <Btn
        aria-label={t({ en: 'Clear selection', pl: 'Wyczyść zaznaczenie' })}
        className={css.clear}
        icon={<XIcon aria-hidden='true' />}
        iconOnly
        onClick={onClear}
        radius='pill'
        variant='ghost'
      />
      <span aria-live='polite' className={css.count}>
        {t({ en: `${count} selected`, pl: `Zaznaczono: ${count}` })}
      </span>
      {/* Phones stack the number over a caption so the row keeps room for its buttons. */}
      <span aria-hidden='true' className={css.tally}>
        <span className={css.tallyNumber}>{count}</span>
        <span className={css.tallyCaption}>{t({ en: 'selected', pl: 'zaznaczono' })}</span>
      </span>
      <Btn
        aria-controls={moreId}
        aria-expanded={expanded}
        className={css.toggle}
        icon={<ChevronUpIcon aria-hidden='true' />}
        onClick={() => setExpanded((current) => !current)}
        radius='pill'
        ref={toggleRef}
        variant='ghost'
      >
        {t({ en: 'More', pl: 'Więcej' })}
      </Btn>
      <div className={css.more} id={moreId}>
        {children}
      </div>
      {primary}
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

/** Icon and visible label; secondary actions become tiles in the phone More panel. */
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
      {label}
    </Btn>
  );
}
