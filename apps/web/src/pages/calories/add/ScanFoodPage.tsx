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

/** Camera-first barcode lookup; a match opens the Add food confirm step as a new history entry. */
export function ScanFoodPage({ initialDate: date }: { initialDate: string }) {
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
        await navigate({ search: { date, foodId: result.food.id }, to: '/calories/add' });
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
        <h1>Scan barcode</h1>
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
          aria-label='Enter barcode manually'
          inputMode='numeric'
          name='barcode'
          placeholder='Or type the barcode'
        />
        <Btn type='submit' variant='outlineMain'>
          Look up
        </Btn>
      </TypedForm>
    </main>
  );
}
