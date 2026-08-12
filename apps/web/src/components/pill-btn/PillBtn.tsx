import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import css from './PillBtn.module.css';

type PillBtnProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  'aria-current' | 'children' | 'className'
> & {
  active?: boolean;
  className?: string;
  collapseLabelAt?: 'phone' | 'tablet';
  label: string;
  visual: ReactNode;
};

export function PillBtn({
  active = false,
  className,
  collapseLabelAt,
  label,
  visual,
  ...linkProps
}: PillBtnProps) {
  return (
    <Link
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      className={clsx(
        css.root,
        active && css.active,
        collapseLabelAt === 'phone' && css.collapseOnPhone,
        collapseLabelAt === 'tablet' && css.collapseOnTablet,
        className,
      )}
      {...linkProps}
    >
      <span aria-hidden='true' className={css.visual}>
        {visual}
      </span>
      <span className={css.label}>{label}</span>
    </Link>
  );
}
