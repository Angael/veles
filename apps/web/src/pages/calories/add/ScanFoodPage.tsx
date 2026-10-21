import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { RouteBackButton } from '@/components/app/app-frame/RouteBackButton';
import { Btn } from '@/components/ui/btn/Btn';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { calorieFoodQueryOptions, useLookupFoodByBarcodeMutation } from '../calories.query';
import { BarcodeScanner } from './BarcodeScanner';
import { LookupNotice, type LookupState } from './ScanNotice';
import css from './ScanFoodPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** Camera-first barcode lookup; a match opens the diary's Add food dialog for that food. */
export function ScanFoodPage({ initialDate: date }: { initialDate: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lookingUp = useRef(false);
  const lookupMutation = useLookupFoodByBarcodeMutation();
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' });

  /** Looks up a scanned or typed barcode and opens the food on a match. */
  async function lookupBarcode(barcode: string) {
    if (!barcode || lookingUp.current) return;
    lookingUp.current = true;
    setLookup({ barcode, status: 'lookingUp' });
    try {
      const result = await lookupMutation.mutateAsync({ data: { barcode } });
      if (result.status === 'found') {
        queryClient.setQueryData(calorieFoodQueryOptions(result.food.id).queryKey, result.food);
        await navigate({
          replace: true,
          search: { date, foodId: result.food.id },
          to: '/calories',
        });
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
    <main className={css.scanPage}>
      <header className={css.header}>
        <RouteBackButton variant='ghost' />
        <h1>{t({ en: 'Scan barcode', pl: 'Zeskanuj kod kreskowy' })}</h1>
      </header>
      <BarcodeScanner
        notice={
          lookup.status === 'idle' ? null : (
            <LookupNotice
              date={date}
              lookup={lookup}
              onDismiss={() => setLookup({ status: 'idle' })}
              onRetry={(barcode) => void lookupBarcode(barcode)}
            />
          )
        }
        onScan={(barcode) => void lookupBarcode(barcode)}
      />
      <TypedForm
        className={css.manualEntry}
        onSubmit={(data) => lookupBarcode(data.string('barcode'))}
      >
        <TextInput
          aria-label={t({ en: 'Enter barcode manually', pl: 'Wpisz kod kreskowy ręcznie' })}
          inputMode='numeric'
          name='barcode'
          placeholder={t({ en: 'Or type the barcode', pl: 'Lub wpisz kod kreskowy' })}
        />
        <Btn type='submit' variant='outlineMain'>
          {t({ en: 'Look up', pl: 'Szukaj' })}
        </Btn>
      </TypedForm>
    </main>
  );
}
