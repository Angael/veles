import { LoaderCircleIcon, TriangleAlertIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import css from './ScanNotice.module.css';

type ScanNoticeProps = {
  /** Action buttons, laid out in two equal columns. */
  children?: ReactNode;
  detail: string;
  icon?: ReactNode;
  title: string;
  tone?: 'danger';
};

/** Scanner feedback card shown over the camera preview. */
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

/** Spinning icon for a lookup in progress. */
export function ScanLoadingIcon() {
  return <LoaderCircleIcon aria-hidden='true' className={css.spinner} />;
}
