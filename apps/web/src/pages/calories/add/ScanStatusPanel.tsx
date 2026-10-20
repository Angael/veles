import { Link } from '@tanstack/react-router';
import { LoaderCircleIcon, SearchXIcon, TriangleAlertIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { TextInput } from '@/components/ui/text-input/TextInput';
import css from './ScanStatusPanel.module.css';

export type LookupState =
  | { status: 'idle' }
  | { barcode: string; status: 'lookingUp' | 'notFound' | 'error' };

type ScanStatusPanelProps = {
  barcode: string;
  date: string;
  lookup: LookupState;
  onBarcodeChange: (barcode: string) => void;
  onLookup: (barcode: string) => void;
  onReset: () => void;
};

/**
 * Solid status area below the camera preview: manual entry while scanning, then lookup progress,
 * not-found, and error feedback with next steps. Keeps text off the live camera image.
 */
export function ScanStatusPanel({
  barcode,
  date,
  lookup,
  onBarcodeChange,
  onLookup,
  onReset,
}: ScanStatusPanelProps) {
  let message: ReactNode = null;
  let actions: ReactNode = null;

  if (lookup.status === 'idle') {
    actions = (
      <form
        className={css.manualEntry}
        onSubmit={(event) => {
          event.preventDefault();
          onLookup(barcode);
        }}
      >
        <TextInput
          aria-label='Enter barcode manually'
          inputMode='numeric'
          onValueChange={onBarcodeChange}
          placeholder='Or type the barcode'
          value={barcode}
        />
        <Btn type='submit' variant='outlineMain'>
          Look up
        </Btn>
      </form>
    );
  } else if (lookup.status === 'lookingUp') {
    message = (
      <StatusMessage
        detail={lookup.barcode}
        icon={<LoaderCircleIcon aria-hidden='true' className={css.spinner} />}
        title='Looking up product…'
      />
    );
  } else if (lookup.status === 'notFound') {
    message = (
      <StatusMessage
        detail={`No product matches ${lookup.barcode}.`}
        icon={<SearchXIcon aria-hidden='true' />}
        title='Product not found'
      />
    );
    actions = (
      <div className={css.actions}>
        <Btn onClick={onReset} variant='ghost'>
          Scan again
        </Btn>
        <Btn
          isLink
          render={<Link search={{ barcode: lookup.barcode, date }} to='/calories/foods/new' />}
        >
          Add product
        </Btn>
      </div>
    );
  } else {
    message = (
      <StatusMessage
        detail={`We could not check ${lookup.barcode}. Check your connection and try again.`}
        icon={<TriangleAlertIcon aria-hidden='true' />}
        title='Lookup failed'
      />
    );
    actions = (
      <div className={css.actions}>
        <Btn onClick={onReset} variant='ghost'>
          Scan again
        </Btn>
        <Btn onClick={() => onLookup(lookup.barcode)}>Try again</Btn>
      </div>
    );
  }

  return (
    <section aria-label='Scan status' className={css.panel} data-status={lookup.status}>
      <div aria-live='polite'>{message}</div>
      {actions}
    </section>
  );
}

function StatusMessage({
  detail,
  icon,
  title,
}: {
  detail: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className={css.message}>
      {icon}
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}
