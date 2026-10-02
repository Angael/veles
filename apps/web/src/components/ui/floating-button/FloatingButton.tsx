import { Link } from '@tanstack/react-router';
import type { ComponentProps, ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import css from './FloatingButton.module.css';

type FloatingButtonProps = {
  children: ReactNode;
  icon?: ReactNode;
} & (
  | { loading?: never; onClick?: never; render?: never; to: string }
  | { loading?: boolean; onClick: () => void; render?: never; to?: never }
  | {
      loading?: boolean;
      onClick?: never;
      render: ComponentProps<typeof Btn>['render'];
      to?: never;
    }
);

export function FloatingButton(props: FloatingButtonProps) {
  return (
    // Stars orbit in the ring between this wrapper and the button (after React Bits "Star Border").
    <span className={`${css.orbit} floatingButton`}>
      <span aria-hidden='true' className={css.starBottom} />
      <span aria-hidden='true' className={css.starTop} />
      <FloatingButtonControl {...props} />
    </span>
  );
}

function FloatingButtonControl(props: FloatingButtonProps) {
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

  if (props.render) {
    return (
      <Btn
        aria-label={typeof props.children === 'string' ? props.children : undefined}
        className={css.button}
        icon={props.icon}
        loading={props.loading}
        radius='pill'
        render={props.render}
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
