import { Link } from '@tanstack/react-router';
import { LoaderCircleIcon, SearchXIcon, TriangleAlertIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import css from './ScanNotice.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export type LookupState =
  | { status: 'idle' }
  | { barcode: string; status: 'lookingUp' | 'notFound' | 'error' };

type LookupNoticeProps = {
  date: string;
  lookup: Exclude<LookupState, { status: 'idle' }>;
  onDismiss: () => void;
  onRetry: (barcode: string) => void;
};

/** Lookup progress and failures, with the next steps for each. */
export function LookupNotice({ date, lookup, onDismiss, onRetry }: LookupNoticeProps) {
  const { t } = useI18n();
  switch (lookup.status) {
    case 'lookingUp':
      return (
        <ScanNotice
          detail={lookup.barcode}
          icon={<LoaderCircleIcon aria-hidden='true' className={css.spinner} />}
          title={t({ en: 'Looking up product…', pl: 'Wyszukiwanie produktu…' })}
        />
      );
    case 'notFound':
      return (
        <ScanNotice
          detail={t({
            en: `No product matches ${lookup.barcode}.`,
            pl: `Brak produktu dla kodu ${lookup.barcode}.`,
          })}
          icon={<SearchXIcon aria-hidden='true' />}
          title={t({ en: 'Product not found', pl: 'Nie znaleziono produktu' })}
        >
          <Btn onClick={onDismiss} variant='ghost'>
            {t({ en: 'Scan again', pl: 'Skanuj ponownie' })}
          </Btn>
          <Btn
            isLink
            render={<Link search={{ barcode: lookup.barcode, date }} to='/calories/foods/new' />}
          >
            {t({ en: 'Add product', pl: 'Dodaj produkt' })}
          </Btn>
        </ScanNotice>
      );
    case 'error':
      return (
        <ScanNotice
          detail={t({
            en: `We could not check ${lookup.barcode}. Check your connection and try again.`,
            pl: `Nie udało się sprawdzić kodu ${lookup.barcode}. Sprawdź połączenie i spróbuj ponownie.`,
          })}
          title={t({ en: 'Lookup failed', pl: 'Wyszukiwanie nie powiodło się' })}
          tone='danger'
        >
          <Btn onClick={onDismiss} variant='ghost'>
            {t({ en: 'Scan again', pl: 'Skanuj ponownie' })}
          </Btn>
          <Btn onClick={() => onRetry(lookup.barcode)}>
            {t({ en: 'Try again', pl: 'Spróbuj ponownie' })}
          </Btn>
        </ScanNotice>
      );
  }
}

type ScanNoticeProps = {
  /** Action buttons, laid out in two equal columns. */
  children?: ReactNode;
  detail: string;
  icon?: ReactNode;
  title: string;
  tone?: 'danger';
};

export function ScanNotice({
  children,
  detail,
  icon = <TriangleAlertIcon aria-hidden='true' />,
  title,
  tone,
}: ScanNoticeProps) {
  return (
    <div className={css.notice} data-tone={tone}>
      <div className={css.message}>
        {icon}
        <div>
          <strong>{title}</strong>
          <p>{detail}</p>
        </div>
      </div>
      {children ? <div className={css.actions}>{children}</div> : null}
    </div>
  );
}
