import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import type { CalorieFood } from '../calories.api';
import { recordFood } from '../calories.api';
import {
  calorieFoodQueryOptions,
  calorieFoodsQueryOptions,
  invalidateCalorieWeek,
} from '../calorieQueries';
import { formatNutritionNumber } from '../dashboard/nutritionFormat';
import { filterFoods } from './filterFoods';
import { Btn } from '@/components/btn/Btn';
import { FloatingButton } from '@/components/floating-button/FloatingButton';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextInput } from '@/components/text-input/TextInput';
import css from './AddFoodPage.module.css';

type Props = { date: string; initialFoodId?: string };

function shownGrams(food: CalorieFood) {
  return food.productSizeGrams ?? 100;
}

function nutritionAtGrams(valuePer100g: number | null, grams: number) {
  return Math.round(((valuePer100g ?? 0) * grams) / 100);
}

export function AddFoodPage({ date, initialFoodId }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [isFiltering, startFiltering] = useTransition();
  const [selected, setSelected] = useState<CalorieFood | null>(null);
  const [grams, setGrams] = useState<number | null>(100);
  const [mutationPending, setMutationPending] = useState(false);
  const foodQuery = useQuery({
    ...calorieFoodQueryOptions(initialFoodId ?? ''),
    enabled: initialFoodId !== undefined,
  });
  const foodsQuery = useQuery(calorieFoodsQueryOptions());
  const foods = filterFoods(foodsQuery.data ?? [], filterQuery);

  useEffect(() => {
    if (!foodQuery.data) return;

    setSelected(foodQuery.data);
    setGrams(shownGrams(foodQuery.data));
  }, [foodQuery.data]);

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

  function selectFood(food: CalorieFood) {
    setSelected(food);
    setGrams(shownGrams(food));
  }

  if (selected) {
    const selectedGrams = grams ?? 0;
    const kcal = nutritionAtGrams(selected.kcalPer100g, selectedGrams);

    return (
      <main className={css.page}>
        <section className={css.panel}>
          <div className={css.selectedSummary}>
            <div>
              <strong>{selected.name}</strong>
              <span>{formatNutritionNumber(kcal)} kcal</span>
            </div>
            <Btn
              aria-label={`Edit ${selected.name}`}
              icon={<PencilIcon aria-hidden='true' />}
              iconOnly
              isLink
              render={<Link params={{ foodId: selected.id }} to='/calories/foods/$foodId' />}
              size='sm'
              variant='ghost'
            />
          </div>

          <Label text='Amount eaten (g)'>
            <NumberInput min={0.01} onValueChange={setGrams} step={0.01} value={grams} />
          </Label>

          <div className={css.selectedActions}>
            <Btn onClick={() => setSelected(null)} variant='ghost'>
              Go back
            </Btn>
            <Btn loading={mutationPending} onClick={() => void add()}>
              Save
            </Btn>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={css.page}>
      <section className={css.search}>
        <Label text='Food name'>
          <TextInput
            autoFocus
            onValueChange={(value) => {
              setQuery(value);
              startFiltering(() => setFilterQuery(value));
            }}
            placeholder='Banana, bread, yoghurt…'
            value={query}
          />
        </Label>
      </section>

      <ul aria-busy={foodsQuery.isFetching || isFiltering} className={css.results}>
        {foods.map((food) => {
          const productGrams = shownGrams(food);
          const kcal = nutritionAtGrams(food.kcalPer100g, productGrams);

          return (
            <li key={food.id}>
              <button className={css.product} onClick={() => selectFood(food)} type='button'>
                <span aria-hidden='true' className={css.energyTile}>
                  <strong>{formatNutritionNumber(kcal)}</strong>
                  <span>kcal</span>
                </span>
                <span className={css.productBody}>
                  <span className={css.productTop}>
                    <strong className={css.productName}>{food.name}</strong>
                    <span className={css.grams}>{formatNutritionNumber(productGrams)} g</span>
                  </span>
                  <span className={css.productBottom}>
                    <span aria-hidden='true' className={css.energyInline}>
                      <strong>{formatNutritionNumber(kcal)}</strong>
                      <span>kcal</span>
                    </span>
                    <span className={css.macros}>
                      <span
                        aria-label={`${nutritionAtGrams(food.proteinPer100g, productGrams)} grams protein`}
                      >
                        <i aria-hidden='true' className={css.dotProtein} />
                        {nutritionAtGrams(food.proteinPer100g, productGrams)} g
                      </span>
                      <span
                        aria-label={`${nutritionAtGrams(food.fatPer100g, productGrams)} grams fat`}
                      >
                        <i aria-hidden='true' className={css.dotFat} />
                        {nutritionAtGrams(food.fatPer100g, productGrams)} g
                      </span>
                      <span
                        aria-label={`${nutritionAtGrams(food.carbsPer100g, productGrams)} grams carbs`}
                      >
                        <i aria-hidden='true' className={css.dotCarbs} />
                        {nutritionAtGrams(food.carbsPer100g, productGrams)} g
                      </span>
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {!foodsQuery.isFetching && foods.length === 0 ? (
        <p className={css.empty}>No foods match “{query.trim()}”.</p>
      ) : null}

      <FloatingButton
        icon={<PlusIcon aria-hidden='true' />}
        to={`/calories/foods/new?date=${encodeURIComponent(date)}&name=${encodeURIComponent(query)}`}
      >
        Create new food
      </FloatingButton>
    </main>
  );
}
