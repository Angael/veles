import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import css from './Skeleton.module.css';

type SkeletonProps = ComponentPropsWithoutRef<'div'>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div aria-hidden='true' className={clsx(css.skeleton, className)} {...props} />;
}
