import { Button } from '@base-ui/react/button';
import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import css from './Btn.module.css';

type BtnVariant = 'primary' | 'secondary' | 'white' | 'ghost';
type BtnSize = 'sm' | 'md' | 'lg';
type BtnRadius = 'md' | 'pill';

type BtnProps = Omit<ComponentPropsWithoutRef<typeof Button>, 'className' | 'children'> & {
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
  iconOnly?: boolean;
  isLink?: boolean;
  radius?: BtnRadius;
  size?: BtnSize;
  variant?: BtnVariant;
};

export function Btn({
  children,
  className,
  icon,
  iconOnly = false,
  isLink = false,
  radius = 'md',
  size = 'md',
  variant = 'secondary',
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
        isLink ? css.link : css.button,
        className,
      )}
      nativeButton={!isLink}
      {...props}
    >
      {icon ? <span className={css.icon}>{icon}</span> : null}
      {children ? <span className={css.content}>{children}</span> : null}
    </Button>
  );
}
