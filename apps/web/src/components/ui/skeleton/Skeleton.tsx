import clsx from 'clsx';
import type { ComponentProps } from 'react';
import css from './Skeleton.module.css';

type SkeletonProps = ComponentProps<'div'>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div aria-hidden='true' className={clsx(css.skeleton, className)} {...props} />;
}
