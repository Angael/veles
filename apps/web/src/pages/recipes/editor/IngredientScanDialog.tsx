import { SearchXIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import type { CalorieFood } from '@/pages/calories/calories.api';
import { useLookupFoodByBarcodeMutation } from '@/pages/calories/calories.query';
import { BarcodeScanner } from '@/components/ui/barcode-scanner/BarcodeScanner';
import { ScanLoadingIcon, ScanNotice } from '@/components/ui/barcode-scanner/ScanNotice';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { TextInput } from '@/components/ui/text-input/TextInput';
import css from './IngredientScanDialog.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  onFound: (food: CalorieFood) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

type Lookup = { status: 'idle' } | { barcode: string; status: 'lookingUp' | 'notFound' | 'error' };

/**
 * Finds an ingredient's product by barcode with the same scanner and lookup as Add food. It only
 * links the product to the ingredient; nothing is logged. Unknown barcodes keep the row as is.
 */
export function IngredientScanDialog({ onFound, onOpenChange, open }: Props) {
  const { t } = useI18n();
  const lookupMutation = useLookupFoodByBarcodeMutation();
  const lookingUp = useRef(false);
  const [lookup, setLookup] = useState<Lookup>({ status: 'idle' });
  const [typed, setTyped] = useState('');

  /** Looks up one barcode at a time and hands a match to the ingredient row. */
  async function lookupBarcode(barcode: string) {
    if (!barcode || lookingUp.current) return;
    lookingUp.current = true;
    setLookup({ barcode, status: 'lookingUp' });
    try {
      const result = await lookupMutation.mutateAsync({ data: { barcode } });
      if (result.status === 'found') {
        setLookup({ status: 'idle' });
        onFound(result.food);
      } else {
        setLookup({ barcode, status: 'notFound' });
      }
    } catch {
      setLookup({ barcode, status: 'error' });
    } finally {
      lookingUp.current = false;
    }
  }

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup className={css.popup}>
        <DialogTitle>{t({ en: 'Scan ingredient', pl: 'Zeskanuj składnik' })}</DialogTitle>
        <div className={css.camera}>
          <BarcodeScanner
            notice={
              <LookupMessage lookup={lookup} onDismiss={() => setLookup({ status: 'idle' })} />
            }
            onScan={(barcode) => void lookupBarcode(barcode)}
          />
        </div>
        <div className={css.manual}>
          <TextInput
            aria-label={t({ en: 'Enter barcode manually', pl: 'Wpisz kod kreskowy ręcznie' })}
            inputMode='numeric'
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void lookupBarcode(typed.trim());
              }
            }}
            onValueChange={setTyped}
            placeholder={t({ en: 'Or type the barcode', pl: 'Lub wpisz kod kreskowy' })}
            value={typed}
          />
          <Btn onClick={() => void lookupBarcode(typed.trim())} type='button' variant='outlineMain'>
            {t({ en: 'Look up', pl: 'Szukaj' })}
          </Btn>
        </div>
        <DialogActions>
          <DialogClose render={<Btn type='button' variant='ghost' />}>
            {t({ en: 'Cancel', pl: 'Anuluj' })}
          </DialogClose>
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}

function LookupMessage({ lookup, onDismiss }: { lookup: Lookup; onDismiss: () => void }) {
  const { t } = useI18n();
  if (lookup.status === 'idle') return null;
  if (lookup.status === 'lookingUp')
    return (
      <ScanNotice
        detail={lookup.barcode}
        icon={<ScanLoadingIcon />}
        title={t({ en: 'Looking up product…', pl: 'Wyszukiwanie produktu…' })}
      />
    );
  return (
    <ScanNotice
      detail={
        lookup.status === 'notFound'
          ? t({
              en: `No product matches ${lookup.barcode}. Type the ingredient as custom text instead.`,
              pl: `Brak produktu dla kodu ${lookup.barcode}. Wpisz składnik jako własny tekst.`,
            })
          : t({
              en: `We could not check ${lookup.barcode}. Check your connection and try again.`,
              pl: `Nie udało się sprawdzić kodu ${lookup.barcode}. Sprawdź połączenie i spróbuj ponownie.`,
            })
      }
      icon={lookup.status === 'notFound' ? <SearchXIcon aria-hidden='true' /> : undefined}
      title={
        lookup.status === 'notFound'
          ? t({ en: 'Product not found', pl: 'Nie znaleziono produktu' })
          : t({ en: 'Lookup failed', pl: 'Wyszukiwanie nie powiodło się' })
      }
      tone={lookup.status === 'error' ? 'danger' : undefined}
    >
      <Btn onClick={onDismiss} type='button' variant='ghost'>
        {t({ en: 'Scan again', pl: 'Skanuj ponownie' })}
      </Btn>
    </ScanNotice>
  );
}
