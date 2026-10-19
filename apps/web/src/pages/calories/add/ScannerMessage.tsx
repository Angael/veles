import { CameraIcon, CameraOffIcon, LoaderCircleIcon, SearchXIcon } from 'lucide-react';
import css from './BarcodeScanner.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Localized } from '@/lib/i18n/locale';

export type ScannerState =
  | 'starting'
  | 'scanning'
  | 'lookingUp'
  | 'notFound'
  | 'permissionDenied'
  | 'unavailable'
  | 'error';

export function ScannerMessage({ state }: { state: Exclude<ScannerState, 'scanning'> }) {
  const { t } = useI18n();

  if (state === 'starting') {
    return (
      <div className={css.message}>
        <CameraIcon aria-hidden='true' />
        <strong>{t({ en: 'Starting camera…', pl: 'Uruchamianie kamery…' })}</strong>
        <span>
          {t({ en: 'You may be asked for permission.', pl: 'Przeglądarka może poprosić o zgodę.' })}
        </span>
      </div>
    );
  }

  const copy = scannerMessageCopy[state];
  let icon = <CameraOffIcon aria-hidden='true' />;
  if (state === 'lookingUp') {
    icon = <LoaderCircleIcon aria-hidden='true' className={css.loadingIcon} />;
  } else if (state === 'notFound') {
    icon = <SearchXIcon aria-hidden='true' />;
  }

  return (
    <div className={css.message} role={state === 'lookingUp' ? 'status' : 'alert'}>
      {icon}
      <strong>{t(copy[0])}</strong>
      <span>{t(copy[1])}</span>
    </div>
  );
}

const scannerMessageCopy: Record<
  Exclude<ScannerState, 'starting' | 'scanning'>,
  [Localized, Localized]
> = {
  lookingUp: [
    { en: 'Looking up product…', pl: 'Wyszukiwanie produktu…' },
    { en: 'Checking the product catalog.', pl: 'Sprawdzanie katalogu produktów.' },
  ],
  notFound: [
    { en: 'Barcode not found', pl: 'Nie znaleziono kodu kreskowego' },
    {
      en: 'Create this product or scan another barcode.',
      pl: 'Utwórz ten produkt lub zeskanuj inny kod.',
    },
  ],
  permissionDenied: [
    { en: 'Camera permission denied', pl: 'Brak zgody na użycie kamery' },
    {
      en: 'Allow camera access in your browser settings, or type the barcode instead.',
      pl: 'Zezwól na dostęp do kamery w ustawieniach przeglądarki albo wpisz kod ręcznie.',
    },
  ],
  unavailable: [
    { en: 'Camera unavailable', pl: 'Kamera niedostępna' },
    {
      en: 'This browser cannot access a camera. You can still type the barcode.',
      pl: 'Ta przeglądarka nie ma dostępu do kamery. Nadal możesz wpisać kod.',
    },
  ],
  error: [
    { en: 'Scanner stopped', pl: 'Skaner zatrzymany' },
    {
      en: 'We could not read from the camera. Close it and try again, or type the barcode.',
      pl: 'Nie udało się odczytać obrazu z kamery. Zamknij ją i spróbuj ponownie albo wpisz kod.',
    },
  ],
};
