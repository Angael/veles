import { Link, useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import css from './CalorieFlows.module.css';
import { todayLocalDate } from './calorieDate';
import { lookupFoodByBarcode, recordFood, type CalorieFood } from './calories.api';

export function ScanFoodPage() {
  const navigate = useNavigate();
  const lookingUp = useRef(false);
  const [barcode, setBarcode] = useState('');
  const [missing, setMissing] = useState('');
  const [food, setFood] = useState<CalorieFood | null>(null);
  const [grams, setGrams] = useState('100');
  const [date, setDate] = useState(todayLocalDate());

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
        setGrams(String(result.food.productSizeGrams ?? 100));
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
    await recordFood({ data: { date, grams: Number(grams), productId: food.id } });
    await navigate({ to: '/calories', search: { date } });
  }

  return (
    <main className={css.page}>
      <Link className={css.back} search={{ date }} to='/calories'>
        ← Diary
      </Link>
      <header className={css.header}>
        <div>
          <h1>Look up barcode</h1>
          <p>Enter the digits printed beneath the product barcode.</p>
        </div>
      </header>

      {!food ? (
        <section className={css.panel}>
          <div className={css.barcodeInput}>
            <input
              aria-label='Enter barcode manually'
              inputMode='numeric'
              onChange={(event) => setBarcode(event.target.value)}
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
                <Link search={{ barcode: missing, date }} to='/calories/foods/new'>
                  Create product
                </Link>
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
                {food.carbsPer100g ?? 0} g carbs · {food.fatPer100g ?? 0} g fat / 100 g
              </p>
            </div>
          </section>
          <section className={css.panel}>
            <div className={css.grid}>
              <label className={css.field}>
                <span>Quantity (g)</span>
                <input
                  min='0.01'
                  onChange={(event) => setGrams(event.target.value)}
                  step='0.01'
                  type='number'
                  value={grams}
                />
              </label>
              <label className={css.field}>
                <span>Date</span>
                <input onChange={(event) => setDate(event.target.value)} type='date' value={date} />
              </label>
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
