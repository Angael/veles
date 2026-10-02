import { ContextMenu } from '@base-ui/react/context-menu';
import clsx from 'clsx';
import type { ComponentPropsWithRef, ComponentPropsWithoutRef, ReactNode } from 'react';
import css from './ContextMenu.module.css';

export const ContextMenuRoot = ContextMenu.Root;

/** Area opening the menu on right click or long press; adds the shared "has more actions" cue. */
export function ContextMenuTrigger({
  className,
  ...props
}: ComponentPropsWithRef<typeof ContextMenu.Trigger>) {
  return <ContextMenu.Trigger className={clsx(css.trigger, className)} {...props} />;
}

/** Portals the menu next to the pointer or the long-pressed point. */
export function ContextMenuPopup({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof ContextMenu.Popup>) {
  return (
    <ContextMenu.Portal>
      <ContextMenu.Positioner className={css.positioner}>
        <ContextMenu.Popup className={clsx(css.popup, className)} {...props} />
      </ContextMenu.Positioner>
    </ContextMenu.Portal>
  );
}

type ItemContentProps = {
  icon: ReactNode;
  label: ReactNode;
  /** Danger styling for destructive actions such as delete. */
  variant?: 'danger' | 'default';
};

type ContextMenuItemProps = Omit<ComponentPropsWithoutRef<typeof ContextMenu.Item>, 'children'> &
  ItemContentProps;

export function ContextMenuItem({
  className,
  icon,
  label,
  variant = 'default',
  ...props
}: ContextMenuItemProps) {
  return (
    <ContextMenu.Item
      className={clsx(css.item, variant === 'danger' && css.danger, className)}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </ContextMenu.Item>
  );
}

type ContextMenuLinkItemProps = Omit<
  ComponentPropsWithoutRef<typeof ContextMenu.LinkItem>,
  'children'
> &
  ItemContentProps;

/** Navigation item; pass the router link via `render`. Closes on click, unlike Base UI's default. */
export function ContextMenuLinkItem({
  className,
  closeOnClick = true,
  icon,
  label,
  variant = 'default',
  ...props
}: ContextMenuLinkItemProps) {
  return (
    <ContextMenu.LinkItem
      className={clsx(css.item, variant === 'danger' && css.danger, className)}
      closeOnClick={closeOnClick}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </ContextMenu.LinkItem>
  );
}

export function ContextMenuSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof ContextMenu.Separator>) {
  return <ContextMenu.Separator className={clsx(css.separator, className)} {...props} />;
}
