import { Link, useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import type { CalorieFood } from './calories.api';
import { lookupFoodByBarcode, recordFood } from './calories.api';
import { BarcodeScanner } from './BarcodeScanner';
import { Btn } from '@/components/btn/Btn';
import css from './CalorieFlows.module.css';

export function ScanFoodPage({ date }: { date: string }) {
  const navigate = useNavigate();
  const lookingUp = useRef(false);
  const [barcode, setBarcode] = useState('');
  const [missing, setMissing] = useState('');
  const [food, setFood] = useState<CalorieFood | null>(null);
  const [grams, setGrams] = useState('100');
  async function lookup(code: string) {
    if (lookingUp.current || food || missing) return;
    lookingUp.current = true;
    setBarcode(code);
    try {
      const result = await lookupFoodByBarcode({ data: { barcode: code } });
      if (result.status === 'found') {
        setFood(result.food);
        setGrams(String(result.food.productSizeGrams ?? 100));
      } else setMissing(code);
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
          <h1>Scan barcode</h1>
          <p>Keep the first visible barcode inside the frame.</p>
        </div>
      </header>
      <div className={css.scanner}>
        <BarcodeScanner
          onClose={() => void navigate({ to: '/calories', search: { date } })}
          onDetected={(code) => void lookup(code)}
        />
        {missing ? (
          <section className={css.panel}>
            <strong>Product {missing} was not found</strong>
            <p className={css.muted}>
              The camera is still scanning. Create this product if the code is correct.
            </p>
            <div className={css.actions}>
              <Link
                className={css.back}
                search={{ barcode: missing, date }}
                to='/calories/foods/new'
              >
                Create this product
              </Link>
              <Btn onClick={() => setMissing('')} variant='ghost'>
                Dismiss
              </Btn>
            </div>
          </section>
        ) : null}
        {food ? (
          <section className={css.panel}>
            <strong>{food.name}</strong>
            <p className={css.muted}>{food.kcalPer100g} kcal / 100 g</p>
            <label className={css.field}>
              <span>Amount eaten (g)</span>
              <input
                min='0.01'
                onChange={(event) => setGrams(event.target.value)}
                step='0.01'
                type='number'
                value={grams}
              />
            </label>
            <Btn onClick={() => void add()}>Add to diary</Btn>
          </section>
        ) : null}
        <section className={css.panel}>
          <label className={css.field}>
            <span>Enter barcode manually</span>
            <input
              inputMode='numeric'
              onChange={(event) => setBarcode(event.target.value)}
              value={barcode}
            />
          </label>
          <Btn onClick={() => void lookup(barcode)}>Look up barcode</Btn>
        </section>
      </div>
    </main>
  );
}
