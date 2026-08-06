import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Btn } from '@/components/btn/Btn';
import css from './FloatingButton.module.css';

type FloatingButtonProps = {
  children: ReactNode;
  icon?: ReactNode;
} & (
  | { loading?: never; onClick?: never; to: string }
  | { loading?: boolean; onClick: () => void; to?: never }
);

export function FloatingButton(props: FloatingButtonProps) {
  // TODO: hide this on scroll down once the mobile bottom nav behavior is finalized.
  if (props.to) {
    return (
      <Btn
        aria-label={typeof props.children === 'string' ? props.children : undefined}
        className={css.button}
        icon={props.icon}
        isLink
        radius='pill'
        render={<Link to={props.to} />}
        size='md'
        variant='main'
      >
        {props.children}
      </Btn>
    );
  }

  return (
    <Btn
      aria-label={typeof props.children === 'string' ? props.children : undefined}
      className={css.button}
      icon={props.icon}
      loading={props.loading}
      onClick={props.onClick}
      radius='pill'
      size='md'
      type='button'
      variant='main'
    >
      {props.children}
    </Btn>
  );
}
