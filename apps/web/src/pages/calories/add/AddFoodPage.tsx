import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { BarcodeIcon, PlusIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { FoodSummary } from '../FoodSummary';
import type { CalorieFood } from '../calories.api';
import { calorieFoodQueryOptions, calorieFoodsQueryOptions } from '../calories.query';
import { foodProductNames } from '../calorieHelpers';
import { SelectedFoodForm } from './SelectedFoodForm';
import { filterFoods } from './filterFoods';
import { RecipeResults } from './RecipeResults';
import { Btn } from '@/components/ui/btn/Btn';
import { FloatingButton } from '@/components/ui/floating-button/FloatingButton';
import { List, ListItem } from '@/components/ui/list/List';
import { Label } from '@/components/ui/label/Label';
import { TextInput } from '@/components/ui/text-input/TextInput';
import css from './AddFoodPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

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
  const { formatWhole, locale, t } = useI18n();
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
  const foods = filterFoods(foodsQuery.data ?? [], filterQuery, MAX_VISIBLE_FOODS, locale);

  function selectFood(food: CalorieFood) {
    queryClient.setQueryData(calorieFoodQueryOptions(food.id).queryKey, food);
    void navigate({ search: { date, foodId: food.id }, to: '/calories/add' });
  }

  if (foodId !== undefined && foodQuery.data) {
    return <SelectedFoodForm food={foodQuery.data} initialDate={date} key={foodId} />;
  }

  return (
    <main className={css.page}>
      <Label text={t({ en: 'Food name', pl: 'Nazwa produktu' })}>
        <TextInput
          autoFocus
          onValueChange={(value) => {
            setQuery(value);
            startFiltering(() => setFilterQuery(value));
          }}
          placeholder={t({ en: 'Banana, bread, yoghurt…', pl: 'Banan, chleb, jogurt…' })}
          trailing={
            <Btn
              aria-label={t({ en: 'Scan barcode', pl: 'Skanuj kod kreskowy' })}
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

      <RecipeResults date={date} query={filterQuery} />

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
                category={food.category}
                imageUrl={food.imageUrl}
                kcal={kcal}
                meta={`${formatWhole(productGrams)} g`}
                name={
                  <button
                    className={css.selectButton}
                    onClick={() => selectFood(food)}
                    type='button'
                  >
                    {t(foodProductNames(food))}
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
          <p>
            {t({
              en: `No foods match “${query.trim()}”.`,
              pl: `Brak produktów pasujących do „${query.trim()}”.`,
            })}
          </p>
          <div className={css.emptyActions}>
            <Btn
              isLink
              render={<Link search={{ date, name: query.trim() }} to='/calories/foods/new' />}
              variant='text'
            >
              {t({ en: 'Create the food', pl: 'Utwórz produkt' })}
            </Btn>
          </div>
        </div>
      ) : null}

      <FloatingButton
        icon={<PlusIcon aria-hidden='true' />}
        to={`/calories/foods/new?date=${encodeURIComponent(date)}&name=${encodeURIComponent(query)}`}
      >
        {t({ en: 'Create new food', pl: 'Utwórz nowy produkt' })}
      </FloatingButton>
    </main>
  );
}
