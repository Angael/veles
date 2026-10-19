import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { calorieFoodQueryOptions, useLookupFoodByBarcodeMutation } from '../calories.query';
import { BarcodeScanner, type BarcodeScannerStatus } from './BarcodeScanner';
import { Btn } from '@/components/ui/btn/Btn';
import { TextInput } from '@/components/ui/text-input/TextInput';
import css from '../CalorieFlows.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** Camera-first barcode lookup; a match opens the Add food confirm step as a new history entry. */
export function ScanFoodPage({ initialDate }: { initialDate: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lookingUp = useRef(false);
  const lookupMutation = useLookupFoodByBarcodeMutation();
  const [barcode, setBarcode] = useState('');
  const [missing, setMissing] = useState('');
  const date = initialDate;
  let scannerStatus: BarcodeScannerStatus = 'scanning';
  if (lookupMutation.isPending) scannerStatus = 'lookingUp';
  else if (missing) scannerStatus = 'notFound';

  async function lookup(code: string) {
    if (!code.trim() || lookingUp.current) return;
    lookingUp.current = true;
    setBarcode(code);
    setMissing('');
    try {
      const result = await lookupMutation.mutateAsync({ data: { barcode: code } });
      if (result.status === 'found') {
        queryClient.setQueryData(calorieFoodQueryOptions(result.food.id).queryKey, result.food);
        await navigate({ search: { date, foodId: result.food.id }, to: '/calories/add' });
      } else {
        setMissing(code);
      }
    } finally {
      lookingUp.current = false;
    }
  }

  return (
    <main className={css.scanViewport}>
      <BarcodeScanner onDetected={(code) => void lookup(code)} status={scannerStatus} />
      <div className={css.scanBottom}>
        {missing ? (
          <div className={css.missingProduct}>
            <strong>
              {t({
                en: `Barcode ${missing} was not found`,
                pl: `Nie znaleziono kodu ${missing}`,
              })}
            </strong>
            <div className={css.actions}>
              <Btn
                isLink
                render={<Link search={{ barcode: missing, date }} to='/calories/foods/new' />}
                variant='ghost'
              >
                {t({ en: 'Add product', pl: 'Dodaj produkt' })}
              </Btn>
              <Btn onClick={() => setMissing('')} variant='ghost'>
                {t({ en: 'Scan again', pl: 'Skanuj ponownie' })}
              </Btn>
            </div>
          </div>
        ) : null}
        {!missing && !lookupMutation.isPending ? (
          <div className={css.barcodeInput}>
            <TextInput
              aria-label={t({ en: 'Enter barcode manually', pl: 'Wpisz kod kreskowy ręcznie' })}
              inputMode='numeric'
              onValueChange={setBarcode}
              placeholder={t({ en: 'Enter barcode', pl: 'Wpisz kod kreskowy' })}
              value={barcode}
            />
            <Btn onClick={() => void lookup(barcode)}>{t({ en: 'Look up', pl: 'Szukaj' })}</Btn>
          </div>
        ) : null}
      </div>
    </main>
  );
}
