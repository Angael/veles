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
  return (
    <Btn
      aria-label={typeof children === 'string' ? children : undefined}
      className={css.button}
      icon={icon}
      isLink
      radius='pill'
      render={<Link to={to as never} />}
      size='md'
      variant='primary'
    >
      {children}
    </Btn>
  );
}
