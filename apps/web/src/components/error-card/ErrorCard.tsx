import clsx from 'clsx';
import { CircleAlertIcon } from 'lucide-react';
import { memo } from 'react';
import { Card } from '@/components/card/Card';
import css from './ErrorCard.module.css';

type ErrorCardProps = {
  className?: string;
  message: string;
  title?: string;
};

export const ErrorCard = memo(function ErrorCard({
  className,
  message,
  title = 'Something went wrong',
}: ErrorCardProps) {
  return (
    <Card aria-live='polite' className={clsx(css.card, className)} role='alert' variant='danger'>
      <CircleAlertIcon aria-hidden='true' className={css.icon} size={22} strokeWidth={1.9} />

      <div className={css.content}>
        <p className={css.eyebrow}>{title}</p>
        <p className={css.message}>{message}</p>
      </div>
    </Card>
  );
});
