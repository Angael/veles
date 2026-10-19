import clsx from 'clsx';
import { CircleAlertIcon } from 'lucide-react';
import { memo } from 'react';
import { Card } from '@/components/ui/card/Card';
import css from './ErrorCard.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type ErrorCardProps = {
  className?: string;
  message: string;
  title?: string;
};

export const ErrorCard = memo(function ErrorCard({ className, message, title }: ErrorCardProps) {
  const { t } = useI18n();

  return (
    <Card aria-live='polite' className={clsx(css.card, className)} role='alert' tone='danger'>
      <CircleAlertIcon aria-hidden='true' className={css.icon} size={22} strokeWidth={1.9} />

      <div className={css.content}>
        <p className={css.eyebrow}>
          {title ?? t({ en: 'Something went wrong', pl: 'Coś poszło nie tak' })}
        </p>
        <p className={css.message}>{message}</p>
      </div>
    </Card>
  );
});
