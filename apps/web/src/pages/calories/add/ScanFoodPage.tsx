import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { calorieFoodQueryOptions, useLookupFoodByBarcodeMutation } from '../calories.query';
import { BarcodeScanner } from './BarcodeScanner';
import { ScanStatusPanel, type LookupState } from './ScanStatusPanel';
import css from './ScanFoodPage.module.css';

/** Camera-first barcode lookup; a match opens the Add food confirm step as a new history entry. */
export function ScanFoodPage({ initialDate }: { initialDate: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lookingUp = useRef(false);
  const lookupMutation = useLookupFoodByBarcodeMutation();
  const [barcode, setBarcode] = useState('');
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' });
  const date = initialDate;

  /** Looks up a scanned or typed barcode and opens the food on a match. */
  async function lookupBarcode(code: string) {
    if (!code.trim() || lookingUp.current) return;
    lookingUp.current = true;
    setBarcode(code);
    setLookup({ barcode: code, status: 'lookingUp' });
    try {
      const result = await lookupMutation.mutateAsync({ data: { barcode: code } });
      if (result.status === 'found') {
        queryClient.setQueryData(calorieFoodQueryOptions(result.food.id).queryKey, result.food);
        await navigate({ search: { date, foodId: result.food.id }, to: '/calories/add' });
      } else {
        setLookup({ barcode: code, status: 'notFound' });
      }
    } catch {
      setLookup({ barcode: code, status: 'error' });
    } finally {
      lookingUp.current = false;
    }
  }

  return (
    <main className={css.scanPage}>
      <BarcodeScanner lookup={lookup.status} onDetected={(code) => void lookupBarcode(code)} />
      <ScanStatusPanel
        barcode={barcode}
        date={date}
        lookup={lookup}
        onBarcodeChange={setBarcode}
        onLookup={(code) => void lookupBarcode(code)}
        onReset={() => setLookup({ status: 'idle' })}
      />
    </main>
  );
}
