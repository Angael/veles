import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Btn } from '@/components/btn/Btn';
import css from './FloatingButton.module.css';

type FloatingButtonProps = {
  children: ReactNode;
  icon?: ReactNode;
  to: string;
};

export function FloatingButton({ children, icon, to }: FloatingButtonProps) {
  // TODO: hide this on scroll down once the mobile bottom nav behavior is finalized.
  // TODO: move this toward a more centered desktop position on large screens.
  return (
    <Btn
      aria-label={typeof children === 'string' ? children : undefined}
      className={css.button}
      icon={icon}
      isLink
      radius='pill'
      render={<Link to={to} />}
      size='md'
      variant='main'
    >
      {children}
    </Btn>
  );
}
