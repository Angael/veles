import { Link } from '@tanstack/react-router';
import { LoaderCircleIcon, SearchXIcon, TriangleAlertIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import css from './ScanNotice.module.css';

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
  switch (lookup.status) {
    case 'lookingUp':
      return (
        <ScanNotice
          detail={lookup.barcode}
          icon={<LoaderCircleIcon aria-hidden='true' className={css.spinner} />}
          title='Looking up product…'
        />
      );
    case 'notFound':
      return (
        <ScanNotice
          detail={`No product matches ${lookup.barcode}.`}
          icon={<SearchXIcon aria-hidden='true' />}
          title='Product not found'
        >
          <Btn onClick={onDismiss} variant='ghost'>
            Scan again
          </Btn>
          <Btn
            isLink
            render={<Link search={{ barcode: lookup.barcode, date }} to='/calories/foods/new' />}
          >
            Add product
          </Btn>
        </ScanNotice>
      );
    case 'error':
      return (
        <ScanNotice
          detail={`We could not check ${lookup.barcode}. Check your connection and try again.`}
          title='Lookup failed'
          tone='danger'
        >
          <Btn onClick={onDismiss} variant='ghost'>
            Scan again
          </Btn>
          <Btn onClick={() => onRetry(lookup.barcode)}>Try again</Btn>
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
