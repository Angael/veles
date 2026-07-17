import { Button } from '@base-ui/react/button';
import clsx from 'clsx';
import { LoaderCircleIcon } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import css from './Btn.module.css';

export type BtnVariant =
  | 'main'
  | 'danger'
  | 'outlineMain'
  | 'outlineDanger'
  | 'white'
  | 'ghost'
  | 'ghostDanger';
export type BtnSize = 'sm' | 'md' | 'lg';
type BtnRadius = 'md' | 'pill';

type BtnProps = Omit<ComponentPropsWithoutRef<typeof Button>, 'className' | 'children'> & {
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
  iconOnly?: boolean;
  isLink?: boolean;
  loading?: boolean;
  radius?: BtnRadius;
  size?: BtnSize;
  variant?: BtnVariant;
};

export function Btn({
  children,
  className,
  disabled,
  icon,
  iconOnly = false,
  isLink = false,
  loading = false,
  radius = 'md',
  size = 'md',
  variant = 'main',
  ...props
}: BtnProps) {
  return (
    <Button
      className={clsx(
        css.root,
        css[variant],
        css[size],
        radius === 'pill' && css.pill,
        iconOnly && css.iconOnly,
        loading && css.loading,
        isLink ? css.link : css.button,
        className,
      )}
      nativeButton={!isLink}
      aria-busy={loading || undefined}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? <LoaderCircleIcon aria-hidden='true' className={css.loader} /> : null}
      {icon ? <span className={css.icon}>{icon}</span> : null}
      {children ? <span className={css.content}>{children}</span> : null}
    </Button>
  );
}
