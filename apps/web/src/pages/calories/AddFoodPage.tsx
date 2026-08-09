import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import type { CalorieFood } from './calories.api';
import { getFoodProduct, recordFood, searchFoods } from './calories.api';
import { Btn } from '@/components/btn/Btn';
import css from './CalorieFlows.module.css';

type Props = { date: string; initialFoodId?: string };
export function AddFoodPage({ date, initialFoodId }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<CalorieFood[]>([]);
  const [selected, setSelected] = useState<CalorieFood | null>(null);
  const [grams, setGrams] = useState('100');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    void (initialFoodId
      ? getFoodProduct({ data: { id: initialFoodId } }).then((food) => {
          setSelected(food);
          setGrams(String(food.productSizeGrams ?? 100));
        })
      : searchFoods({ data: { query: '' } }).then(setFoods));
  }, [initialFoodId]);
  async function runSearch() {
    setPending(true);
    try {
      setFoods(await searchFoods({ data: { query } }));
    } finally {
      setPending(false);
    }
  }
  async function add() {
    if (!selected) return;
    setPending(true);
    try {
      await recordFood({ data: { date, grams: Number(grams), productId: selected.id } });
      await navigate({ to: '/calories', search: { date } });
    } finally {
      setPending(false);
    }
  }
  return (
    <main className={css.page}>
      <Link className={css.back} search={{ date }} to='/calories'>
        ← Diary
      </Link>
      <header className={css.header}>
        <div>
          <h1>Add food</h1>
          <p>Search the shared catalog or create something new.</p>
        </div>
      </header>
      {selected ? (
        <section className={css.panel}>
          <div>
            <strong>{selected.name}</strong>
            <p className={css.muted}>{selected.kcalPer100g} kcal / 100 g</p>
          </div>
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
          <div className={css.actions}>
            <Btn disabled={pending} onClick={() => void add()}>
              Add to diary
            </Btn>
            <Btn onClick={() => setSelected(null)} variant='ghost'>
              Choose another
            </Btn>
            <Link
              className={css.back}
              params={{ foodId: selected.id }}
              to='/calories/foods/$foodId'
            >
              Edit food
            </Link>
          </div>
        </section>
      ) : (
        <section className={css.panel}>
          <div className={css.actions}>
            <label className={css.field}>
              <span>Food name</span>
              <input
                autoFocus
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void runSearch();
                }}
                placeholder='Banana, bread, yoghurt…'
                value={query}
              />
            </label>
            <Btn disabled={pending} onClick={() => void runSearch()}>
              Search
            </Btn>
          </div>
          <Link className={css.back} search={{ date, name: query }} to='/calories/foods/new'>
            + Create new food
          </Link>
          <ul className={css.results}>
            {foods.map((food) => (
              <li key={food.id}>
                <button
                  className={css.result}
                  onClick={() => {
                    setSelected(food);
                    setGrams(String(food.productSizeGrams ?? 100));
                  }}
                  type='button'
                >
                  <span>
                    <strong>{food.name}</strong>
                    <span>{food.brand ?? 'Shared food'}</span>
                  </span>
                  <strong>{food.kcalPer100g} kcal</strong>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
