import { ContextMenu } from '@base-ui/react/context-menu';
import clsx from 'clsx';
import { ChevronRightIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import css from './ContextMenu.module.css';

export const ContextMenuRoot = ContextMenu.Root;

/** Area opening the menu on right click or long press; adds the shared "has more actions" cue. */
export const ContextMenuTrigger = ({
  className,
  ...props
}: ComponentProps<typeof ContextMenu.Trigger>) => (
  <ContextMenu.Trigger className={clsx(css.trigger, className)} {...props} />
);

/** Portals the menu next to the pointer or the long-pressed point. */
export const ContextMenuPopup = ({
  className,
  ...props
}: ComponentProps<typeof ContextMenu.Popup>) => (
  <ContextMenu.Portal>
    <ContextMenu.Positioner className={css.positioner}>
      <ContextMenu.Popup className={clsx(css.popup, className)} {...props} />
    </ContextMenu.Positioner>
  </ContextMenu.Portal>
);

type ItemContentProps = {
  icon: ReactNode;
  label: ReactNode;
  /** Danger styling for destructive actions such as delete. */
  variant?: 'danger' | 'default';
};

type ContextMenuItemProps = Omit<ComponentProps<typeof ContextMenu.Item>, 'children'> &
  ItemContentProps;

export const ContextMenuItem = ({
  className,
  icon,
  label,
  variant = 'default',
  ...props
}: ContextMenuItemProps) => (
  <ContextMenu.Item
    className={clsx(css.item, variant === 'danger' && css.danger, className)}
    {...props}
  >
    {icon}
    <span>{label}</span>
  </ContextMenu.Item>
);

type ContextMenuLinkItemProps = Omit<ComponentProps<typeof ContextMenu.LinkItem>, 'children'> &
  ItemContentProps;

/** Navigation item; pass the router link via `render`. Closes on click, unlike Base UI's default. */
export const ContextMenuLinkItem = ({
  className,
  closeOnClick = true,
  icon,
  label,
  variant = 'default',
  ...props
}: ContextMenuLinkItemProps) => (
  <ContextMenu.LinkItem
    className={clsx(css.item, variant === 'danger' && css.danger, className)}
    closeOnClick={closeOnClick}
    {...props}
  >
    {icon}
    <span>{label}</span>
  </ContextMenu.LinkItem>
);

export const ContextMenuSeparator = ({
  className,
  ...props
}: ComponentProps<typeof ContextMenu.Separator>) => (
  <ContextMenu.Separator className={clsx(css.separator, className)} {...props} />
);

export const ContextMenuSubmenuRoot = ContextMenu.SubmenuRoot;

type ContextMenuSubmenuTriggerProps = Omit<
  ComponentProps<typeof ContextMenu.SubmenuTrigger>,
  'children'
> &
  Omit<ItemContentProps, 'variant'>;

/** Item that opens a nested `ContextMenuPopup`; keeps long option lists out of the main menu. */
export const ContextMenuSubmenuTrigger = ({
  className,
  icon,
  label,
  ...props
}: ContextMenuSubmenuTriggerProps) => (
  <ContextMenu.SubmenuTrigger className={clsx(css.item, className)} {...props}>
    {icon}
    <span>{label}</span>
    <ChevronRightIcon aria-hidden='true' className={css.submenuChevron} />
  </ContextMenu.SubmenuTrigger>
);
