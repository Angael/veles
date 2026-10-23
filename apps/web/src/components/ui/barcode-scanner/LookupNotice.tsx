import { SearchXIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ScanLoadingIcon, ScanNotice } from './ScanNotice';
import type { LookupState } from './useBarcodeLookup';
import { Btn } from '@/components/ui/btn/Btn';
import { useI18n } from '@/lib/i18n/I18nProvider';

type LookupNoticeProps = {
  lookup: LookupState;
  /** Extra next step for an unknown barcode, next to "Scan again". */
  notFoundAction?: (barcode: string) => ReactNode;
  onDismiss: () => void;
  onRetry: (barcode: string) => void;
};

/** Lookup progress and failures, with the next steps for each. */
export function LookupNotice({ lookup, notFoundAction, onDismiss, onRetry }: LookupNoticeProps) {
  const { t } = useI18n();
  const scanAgain = (
    <Btn onClick={onDismiss} type='button' variant='ghost'>
      {t({ en: 'Scan again', pl: 'Skanuj ponownie' })}
    </Btn>
  );
  switch (lookup.status) {
    case 'idle':
      return null;
    case 'lookingUp':
      return (
        <ScanNotice
          detail={lookup.barcode}
          icon={<ScanLoadingIcon />}
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
          {scanAgain}
          {notFoundAction?.(lookup.barcode)}
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
          {scanAgain}
          <Btn onClick={() => onRetry(lookup.barcode)} type='button'>
            {t({ en: 'Try again', pl: 'Spróbuj ponownie' })}
          </Btn>
        </ScanNotice>
      );
  }
}
