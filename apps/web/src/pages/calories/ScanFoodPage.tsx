import { Link, useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import type { CalorieFood } from './calories.api';
import { lookupFoodByBarcode, recordFood } from './calories.api';
import { BarcodeScanner } from './BarcodeScanner';
import { Btn } from '@/components/btn/Btn';
import { DateInput } from '@/components/date-input/DateInput';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextInput } from '@/components/text-input/TextInput';
import css from './CalorieFlows.module.css';


export function ScanFoodPage({ initialDate }: { initialDate: string }) {
  const navigate = useNavigate();
  const lookingUp = useRef(false);
  const [barcode, setBarcode] = useState('');
  const [missing, setMissing] = useState('');
  const [food, setFood] = useState<CalorieFood | null>(null);
  const [grams, setGrams] = useState<number | null>(100);
  const [date, setDate] = useState(initialDate);

  async function lookup(code: string) {
    if (!code.trim() || lookingUp.current || food || missing) return;
    lookingUp.current = true;
    setBarcode(code);
    try {
      const result = await lookupFoodByBarcode({ data: { barcode: code } });
      if (result.status === 'found') {
        setFood(result.food);
        setGrams(result.food.productSizeGrams ?? 100);
      } else {
        setFood(null);
        setMissing(code);
      }
    } finally {
      lookingUp.current = false;
    }
  }

  async function add() {
    if (!food) return;
    await recordFood({ data: { date, grams: grams ?? 0, productId: food.id } });
    await navigate({ to: '/calories', search: { date } });
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
                  render={
                    <Link search={{ barcode: missing, date }} to='/calories/foods/new' />
                  }
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
    <main className={css.page}>
      <header className={css.header}>
        <div>
          <h1>Add scanned product</h1>
          <p>Confirm the amount and diary date.</p>
        </div>
      </header>
      <section className={css.productSummary}>
        {food.imageUrl ? <img alt='' src={food.imageUrl} /> : null}
        <div>
          <strong>{food.name}</strong>
          <span>{food.brand}</span>
          <p>
            {food.kcalPer100g} kcal · {food.proteinPer100g ?? 0} g protein ·{' '}
            {food.fatPer100g ?? 0} g fat · {food.carbsPer100g ?? 0} g carbs / 100 g
          </p>
        </div>
      </section>
      <section className={css.panel}>
        <div className={css.grid}>
          <Label text='Quantity (g)'>
            <NumberInput
              min={0.01}
              onValueChange={setGrams}
              step={0.01}
              value={grams}
            />
          </Label>
          <Label text='Date'>
            <DateInput onValueChange={setDate} value={date} />
          </Label>
        </div>
        <div className={css.actions}>
          <Btn onClick={() => void add()}>Add to diary</Btn>
          <Btn
            onClick={() => {
              setFood(null);
              setBarcode('');
            }}
            variant='ghost'
          >
            Scan another
          </Btn>
        </div>
      </section>
    </main>
  );
}
