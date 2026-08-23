import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import type { CalorieFood } from '../calories.api';
import { calorieFoodQueryOptions, calorieFoodsQueryOptions } from '../calories.query';
import { formatNutritionNumber } from '../dashboard/nutritionFormat';
import { SelectedFoodForm } from './SelectedFoodForm';
import { filterFoods } from './filterFoods';
import { Btn } from '@/components/btn/Btn';
import { FloatingButton } from '@/components/floating-button/FloatingButton';
import { Label } from '@/components/label/Label';
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
  const [query, setQuery] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [isFiltering, startFiltering] = useTransition();
  const [selected, setSelected] = useState<CalorieFood | null>(null);
  const foodQuery = useQuery({
    ...calorieFoodQueryOptions(initialFoodId ?? ''),
    enabled: initialFoodId !== undefined,
  });
  const foodsQuery = useQuery(calorieFoodsQueryOptions());
  const foods = filterFoods(foodsQuery.data ?? [], filterQuery);

  useEffect(() => {
    if (!foodQuery.data) return;

    setSelected(foodQuery.data);
  }, [foodQuery.data]);

  function selectFood(food: CalorieFood) {
    setSelected(food);
  }

  if (selected) {
    return (
      <SelectedFoodForm
        cancelLabel='Go back'
        food={selected}
        initialDate={date}
        onCancel={() => setSelected(null)}
      />
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

      {!foodsQuery.isFetching && foods.length === 0 && query.trim() ? (
        <div className={css.empty}>
          <p>No foods match “{query.trim()}”.</p>
          <div className={css.emptyActions}>
            <Btn
              isLink
              render={<Link search={{ date, name: query.trim() }} to='/calories/foods/new' />}
              variant='text'
            >
              Create the food
            </Btn>
            <Btn isLink render={<Link search={{ date }} to='/calories/scan' />} variant='text'>
              Scan
            </Btn>
          </div>
        </div>
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
