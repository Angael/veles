import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import type { CalorieFood } from './calories.api';
import { recordFood } from './calories.api';
import {
  calorieFoodQueryOptions,
  calorieFoodSearchQueryOptions,
  invalidateCalorieWeek,
} from './calorieQueries';
import { Btn } from '@/components/btn/Btn';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextInput } from '@/components/text-input/TextInput';
import css from './CalorieFlows.module.css';

type Props = { date: string; initialFoodId?: string };
export function AddFoodPage({ date, initialFoodId }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [searchEnabled, setSearchEnabled] = useState(initialFoodId === undefined);
  const [selected, setSelected] = useState<CalorieFood | null>(null);
  const [grams, setGrams] = useState<number | null>(100);
  const [mutationPending, setMutationPending] = useState(false);
  const foodQuery = useQuery({
    ...calorieFoodQueryOptions(initialFoodId ?? ''),
    enabled: initialFoodId !== undefined,
  });
  const searchQuery = useQuery({
    ...calorieFoodSearchQueryOptions(submittedQuery),
    enabled: searchEnabled,
  });
  const foods = searchQuery.data ?? [];
  useEffect(() => {
    if (!foodQuery.data) return;

    setSelected(foodQuery.data);
    setGrams(foodQuery.data.productSizeGrams ?? 100);
  }, [foodQuery.data]);

  async function runSearch() {
    const normalizedQuery = query.trim();
    if (normalizedQuery === submittedQuery) {
      await searchQuery.refetch();
    } else {
      setSubmittedQuery(normalizedQuery);
    }
  }
  async function add() {
    if (!selected) return;
    setMutationPending(true);
    try {
      await recordFood({ data: { date, grams: grams ?? 0, productId: selected.id } });
      await invalidateCalorieWeek(queryClient, date);
      await navigate({ to: '/calories', search: { date } });
    } finally {
      setMutationPending(false);
    }
  }
  return (
    <main className={css.page}>
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
          <Label text='Amount eaten (g)'>
            <NumberInput min={0.01} onValueChange={setGrams} step={0.01} value={grams} />
          </Label>
          <div className={css.actions}>
            <Btn disabled={mutationPending} onClick={() => void add()}>
              Add to diary
            </Btn>
            <Btn
              onClick={() => {
                setSelected(null);
                setSearchEnabled(true);
              }}
              variant='ghost'
            >
              Choose another
            </Btn>
            <Btn
              isLink
              render={<Link params={{ foodId: selected.id }} to='/calories/foods/$foodId' />}
              variant='ghost'
            >
              Edit food
            </Btn>
          </div>
        </section>
      ) : (
        <section className={css.panel}>
          <div className={css.actions}>
            <Label text='Food name'>
              <TextInput
                autoFocus
                onValueChange={setQuery}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void runSearch();
                }}
                placeholder='Banana, bread, yoghurt…'
                value={query}
              />
            </Label>
            <Btn disabled={searchQuery.isFetching} onClick={() => void runSearch()}>
              Search
            </Btn>
          </div>
          <Btn
            isLink
            render={<Link search={{ date, name: query }} to='/calories/foods/new' />}
            variant='ghost'
          >
            Create new food
          </Btn>
          <ul className={css.results}>
            {foods.map((food) => (
              <li key={food.id}>
                <button
                  className={css.result}
                  onClick={() => {
                    setSelected(food);
                    setGrams(food.productSizeGrams ?? 100);
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
