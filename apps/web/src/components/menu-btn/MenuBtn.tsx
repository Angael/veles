import { Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { ChevronDownIcon } from 'lucide-react';
import type { ComponentPropsWithRef, ComponentPropsWithoutRef, ReactNode } from 'react';
import css from './MenuBtn.module.css';

export const MenuBtnRoot = Menu.Root;

type MenuBtnProps = ComponentPropsWithRef<typeof Menu.Trigger>;

/** Composes Base UI's menu trigger into reusable buttons such as Btn and FloatingButton. */
export function MenuBtn({ className, ...props }: MenuBtnProps) {
  return <Menu.Trigger className={clsx(css.trigger, className)} {...props} />;
}

export function MenuBtnChevron({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof ChevronDownIcon>) {
  return <ChevronDownIcon aria-hidden='true' className={clsx(css.chevron, className)} {...props} />;
}

type MenuBtnPopupProps = Omit<ComponentPropsWithoutRef<typeof Menu.Popup>, 'children'> & {
  children: ReactNode;
  description?: ReactNode;
  heading?: ReactNode;
  positionerProps?: Omit<
    ComponentPropsWithoutRef<typeof Menu.Positioner>,
    'children' | 'className'
  >;
};

/** Renders the shared anchored popover and mobile bottom-sheet presentation. */
export function MenuBtnPopup({
  children,
  className,
  description,
  heading,
  positionerProps,
  ...props
}: MenuBtnPopupProps) {
  return (
    <Menu.Portal>
      <Menu.Backdrop className={css.backdrop} />
      <Menu.Positioner align='end' className={css.positioner} sideOffset={8} {...positionerProps}>
        <Menu.Popup className={clsx(css.popup, className)} {...props}>
          {heading || description ? (
            <div className={css.mobileHeading}>
              {heading ? <strong>{heading}</strong> : null}
              {description ? <span>{description}</span> : null}
            </div>
          ) : null}
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

type MenuBtnItemProps = Omit<ComponentPropsWithoutRef<typeof Menu.Item>, 'children'> & {
  description?: ReactNode;
  icon: ReactNode;
  label: ReactNode;
};

export function MenuBtnItem({ className, description, icon, label, ...props }: MenuBtnItemProps) {
  return (
    <Menu.Item className={clsx(css.item, className)} {...props}>
      <span className={css.itemIcon}>{icon}</span>
      <span className={css.itemCopy}>
        <strong>{label}</strong>
        {description ? <span>{description}</span> : null}
      </span>
    </Menu.Item>
  );
}

export function MenuBtnDivider({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Separator>) {
  return <Menu.Separator className={clsx(css.divider, className)} {...props} />;
}
