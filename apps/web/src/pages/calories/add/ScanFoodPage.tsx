import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import type { CalorieFood } from '../calories.api';
import { lookupFoodByBarcode } from '../calories.api';
import { invalidateCalorieFoods } from '../calories.query';
import { BarcodeScanner } from './BarcodeScanner';
import { SelectedFoodForm } from './SelectedFoodForm';
import { Btn } from '@/components/btn/Btn';
import { TextInput } from '@/components/text-input/TextInput';
import css from '../CalorieFlows.module.css';

export function ScanFoodPage({ initialDate }: { initialDate: string }) {
  const queryClient = useQueryClient();
  const lookingUp = useRef(false);
  const [barcode, setBarcode] = useState('');
  const [missing, setMissing] = useState('');
  const [food, setFood] = useState<CalorieFood | null>(null);
  const date = initialDate;

  async function lookup(code: string) {
    if (!code.trim() || lookingUp.current || food || missing) return;
    lookingUp.current = true;
    setBarcode(code);
    try {
      const result = await lookupFoodByBarcode({ data: { barcode: code } });
      await invalidateCalorieFoods(queryClient);
      if (result.status === 'found') {
        setFood(result.food);
      } else {
        setFood(null);
        setMissing(code);
      }
    } finally {
      lookingUp.current = false;
    }
  }

  if (!food)
    return (
      <main className={css.scanViewport}>
        <BarcodeScanner
          closeRender={<Link search={{ date }} to='/calories' />}
          onDetected={(code) => void lookup(code)}
        />
        <div className={css.scanBottom}>
          {missing ? (
            <div className={css.missingProduct}>
              <strong>Barcode {missing} was not found</strong>
              <div className={css.actions}>
                <Btn
                  isLink
                  render={<Link search={{ barcode: missing, date }} to='/calories/foods/new' />}
                  variant='ghost'
                >
                  Create product
                </Btn>
                <Btn onClick={() => setMissing('')} variant='ghost'>
                  Keep scanning
                </Btn>
              </div>
            </div>
          ) : null}
          <div className={css.barcodeInput}>
            <TextInput
              aria-label='Enter barcode manually'
              inputMode='numeric'
              onValueChange={setBarcode}
              placeholder='Enter barcode'
              value={barcode}
            />
            <Btn onClick={() => void lookup(barcode)}>Look up</Btn>
          </div>
        </div>
      </main>
    );

  return (
    <SelectedFoodForm
      cancelLabel='Scan another'
      food={food}
      initialDate={date}
      onCancel={() => {
        setFood(null);
        setBarcode('');
      }}
    />
  );
}
