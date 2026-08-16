import { Link, useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { DateInput } from '@/components/date-input/DateInput';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextInput } from '@/components/text-input/TextInput';
import css from './CalorieFlows.module.css';
import { lookupFoodByBarcode, recordFood, type CalorieFood } from './calories.api';

export function ScanFoodPage({ initialDate }: { initialDate: string }) {
  const navigate = useNavigate();
  const lookingUp = useRef(false);
  const [barcode, setBarcode] = useState('');
  const [missing, setMissing] = useState('');
  const [food, setFood] = useState<CalorieFood | null>(null);
  const [grams, setGrams] = useState<number | null>(100);
  const [date, setDate] = useState(initialDate);

  /** Looks up a typed barcode once and prepares the matching product for logging. */
  async function lookup() {
    const code = barcode.trim();
    if (!code || lookingUp.current) return;
    lookingUp.current = true;
    setMissing('');
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

  return (
    <main className={css.page}>
      <header className={css.header}>
        <div>
          <h1>Look up barcode</h1>
          <p>Enter the digits printed beneath the product barcode.</p>
        </div>
      </header>

      {!food ? (
        <section className={css.panel}>
          <div className={css.barcodeInput}>
            <TextInput
              aria-label='Enter barcode manually'
              inputMode='numeric'
              onValueChange={setBarcode}
              placeholder='Enter barcode'
              value={barcode}
            />
            <Btn disabled={!barcode.trim()} onClick={() => void lookup()}>
              Look up
            </Btn>
          </div>
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
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <>
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
              <Btn onClick={() => setFood(null)} variant='ghost'>
                Look up another
              </Btn>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
