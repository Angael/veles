import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { BarcodeIcon, PlusIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { FoodSummary } from '../FoodSummary';
import type { CalorieFood } from '../calories.api';
import { calorieFoodQueryOptions, calorieFoodsQueryOptions } from '../calories.query';
import { SelectedFoodForm } from './SelectedFoodForm';
import { filterFoods } from './filterFoods';
import { Btn } from '@/components/ui/btn/Btn';
import { FloatingButton } from '@/components/ui/floating-button/FloatingButton';
import { List, ListItem } from '@/components/ui/list/List';
import { Label } from '@/components/ui/label/Label';
import { TextInput } from '@/components/ui/text-input/TextInput';
import css from './AddFoodPage.module.css';

type Props = { date: string; foodId?: string };
const MAX_VISIBLE_FOODS = 10;

function shownGrams(food: CalorieFood) {
  return food.productSizeGrams ?? 100;
}
function nutritionAtGrams(valuePer100g: number | null, grams: number) {
  return Math.round(((valuePer100g ?? 0) * grams) / 100);
}

/** Food search; picking a food pushes `?foodId` so back returns from the confirm step to the list. */
export function AddFoodPage({ date, foodId }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [isFiltering, startFiltering] = useTransition();
  const foodQuery = useQuery({
    ...calorieFoodQueryOptions(foodId ?? ''),
    enabled: foodId !== undefined,
  });
  const foodsQuery = useQuery(calorieFoodsQueryOptions());
  const foods = filterFoods(foodsQuery.data ?? [], filterQuery, MAX_VISIBLE_FOODS);

  function selectFood(food: CalorieFood) {
    queryClient.setQueryData(calorieFoodQueryOptions(food.id).queryKey, food);
    void navigate({ search: { date, foodId: food.id }, to: '/calories/add' });
  }

  if (foodId !== undefined && foodQuery.data) {
    return <SelectedFoodForm food={foodQuery.data} initialDate={date} key={foodId} />;
  }

  return (
    <main className={css.page}>
      <Label text='Food name'>
        <TextInput
          autoFocus
          onValueChange={(value) => {
            setQuery(value);
            startFiltering(() => setFilterQuery(value));
          }}
          placeholder='Banana, bread, yoghurt…'
          trailing={
            <Btn
              aria-label='Scan barcode'
              icon={<BarcodeIcon aria-hidden='true' />}
              iconOnly
              isLink
              render={<Link search={{ date }} to='/calories/scan' />}
              size='sm'
              variant='ghost'
            />
          }
          value={query}
        />
      </Label>

      <List aria-busy={foodsQuery.isFetching || isFiltering}>
        {foods.map((food) => {
          const productGrams = shownGrams(food);
          const kcal = nutritionAtGrams(food.kcalPer100g, productGrams);

          return (
            <ListItem interactive key={food.id} style={{ padding: 0 }}>
              <FoodSummary
                carbs={nutritionAtGrams(food.carbsPer100g, productGrams)}
                density='compact'
                fat={nutritionAtGrams(food.fatPer100g, productGrams)}
                imageUrl={food.imageUrl}
                kcal={kcal}
                meta={`${Math.round(productGrams)} g`}
                name={
                  <button
                    className={css.selectButton}
                    onClick={() => selectFood(food)}
                    type='button'
                  >
                    {food.name}
                  </button>
                }
                protein={nutritionAtGrams(food.proteinPer100g, productGrams)}
              />
            </ListItem>
          );
        })}
      </List>

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
