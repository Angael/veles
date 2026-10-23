import { useState } from 'react';
import type { CalorieFood } from '@/pages/calories/calories.api';
import { useLookupFoodByBarcodeMutation } from '@/pages/calories/calories.query';
import { BarcodeScanner } from '@/components/ui/barcode-scanner/BarcodeScanner';
import { LookupNotice } from '@/components/ui/barcode-scanner/LookupNotice';
import { useBarcodeLookup } from '@/components/ui/barcode-scanner/useBarcodeLookup';
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

/**
 * Finds an ingredient's product by barcode with the same scanner and lookup as Add food. It only
 * links the product to the ingredient; nothing is logged. Unknown barcodes keep the row as is.
 */
export function IngredientScanDialog({ onFound, onOpenChange, open }: Props) {
  const { t } = useI18n();
  const lookupMutation = useLookupFoodByBarcodeMutation();
  const { dismiss, lookup, lookupBarcode } = useBarcodeLookup(async (barcode) => {
    const result = await lookupMutation.mutateAsync({ data: { barcode } });
    if (result.status !== 'found') return false;
    onFound(result.food);
    return true;
  });
  const [typed, setTyped] = useState('');

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup className={css.popup}>
        <DialogTitle>{t({ en: 'Scan ingredient', pl: 'Zeskanuj składnik' })}</DialogTitle>
        <div className={css.camera}>
          <BarcodeScanner
            notice={
              <LookupNotice
                lookup={lookup}
                onDismiss={dismiss}
                onRetry={(barcode) => void lookupBarcode(barcode)}
              />
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
