import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import css from './List.module.css';

type ListProps = ComponentPropsWithoutRef<'ul'> & {
  as?: 'ol' | 'ul';
};

type ListItemProps = ComponentPropsWithoutRef<'li'> & {
  interactive?: boolean;
  padding?: 'default' | 'none';
  selected?: boolean;
};

/** Groups compact rows with dividers instead of separate card surfaces. */
export function List({ as: Component = 'ul', className, ...props }: ListProps) {
  return <Component className={clsx(css.list, className)} {...props} />;
}

/** Provides consistent row spacing and optional interaction state within a List. */
export function ListItem({
  className,
  interactive = false,
  padding = 'default',
  selected = false,
  ...props
}: ListItemProps) {
  return (
    <li
      {...props}
      className={clsx(
        css.item,
        interactive && css.interactive,
        padding === 'none' && css.noPadding,
        className,
      )}
      data-selected={selected || undefined}
    />
  );
}
