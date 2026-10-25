import { Combobox } from '@base-ui/react/combobox';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { PlusIcon, ScanLineIcon, SearchIcon } from 'lucide-react';
import { useDeferredValue, useRef, useState } from 'react';
import type { CalorieFood } from '../calories.api';
import { calorieFoodQueryOptions, calorieFoodsQueryOptions } from '../calories.query';
import { FoodSummary } from '../FoodSummary';
import { filterFoods } from '../add/filterFoods';
import { RecipeResults } from '../add/RecipeResults';
import { AddFoodDialog } from './AddFoodDialog';
import { Btn } from '@/components/ui/btn/Btn';
import { List, ListItem } from '@/components/ui/list/List';
import { TextInput } from '@/components/ui/text-input/TextInput';
import css from './FoodSearch.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  date: string;
  /** Food to open immediately, e.g. right after creating it. */
  linkedFoodId?: string;
};

const MAX_VISIBLE_FOODS = 10;

function nutritionAtGrams(valuePer100g: number | null, grams: number) {
  return Math.round(((valuePer100g ?? 0) * grams) / 100);
}

/**
 * Searches foods through an accessible Base UI combobox and opens the entry dialog for the
 * chosen food, so logging happens without leaving the diary.
 */
export function FoodSearch({ date, linkedFoodId }: Props) {
  const { formatWhole, t } = useI18n();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const filterQuery = useDeferredValue(query);
  const [pickedFood, setPickedFood] = useState<CalorieFood | null>(null);
  const foodsQuery = useQuery(calorieFoodsQueryOptions());
  const linkedFoodQuery = useQuery({
    ...calorieFoodQueryOptions(linkedFoodId ?? ''),
    enabled: linkedFoodId !== undefined,
  });
  const allFoods = foodsQuery.data ?? [];
  const foods = filterFoods(allFoods, filterQuery, MAX_VISIBLE_FOODS);
  const linkedFood = linkedFoodId === undefined ? undefined : linkedFoodQuery.data;
  const trimmedQuery = query.trim();

  function clearLinkedFood() {
    if (linkedFoodId === undefined) return;
    void navigate({ replace: true, search: { date }, to: '/calories' });
  }

  function closeDialog() {
    setPickedFood(null);
    clearLinkedFood();
  }

  function handleSaved(savedDate: string) {
    setPickedFood(null);
    if (savedDate !== date || linkedFoodId !== undefined) {
      void navigate({ replace: true, search: { date: savedDate }, to: '/calories' });
    }
  }

  return (
    <>
      <Combobox.Root
        filteredItems={foods}
        inputValue={query}
        itemToStringLabel={(food: CalorieFood) => food.name}
        items={allFoods}
        onInputValueChange={setQuery}
        onValueChange={(food) => {
          if (food) setPickedFood(food);
        }}
        value={null}
      >
        <div className={css.search}>
          <SearchIcon aria-hidden='true' className={css.searchIcon} />
          <Combobox.Input
            aria-label={t({ en: 'Search foods to log', pl: 'Szukaj jedzenia do dodania' })}
            className={css.input}
            placeholder={t({
              en: 'Add food: banana, bread, yoghurt…',
              pl: 'Dodaj jedzenie: banan, chleb, jogurt…',
            })}
            ref={inputRef}
            render={<TextInput />}
          />
        </div>

        <Combobox.Portal>
          <Combobox.Positioner className={css.positioner} sideOffset={4}>
            <Combobox.Popup aria-busy={foodsQuery.isFetching} className={css.popup}>
              <Combobox.Status className={css.message}>
                {foodsQuery.isPending
                  ? t({ en: 'Loading foods…', pl: 'Ładowanie jedzenia…' })
                  : null}
              </Combobox.Status>
              <Combobox.Empty className={css.message}>
                {!foodsQuery.isPending && trimmedQuery
                  ? t({
                      en: `No foods match “${trimmedQuery}”.`,
                      pl: `Brak jedzenia pasującego do „${trimmedQuery}”.`,
                    })
                  : null}
              </Combobox.Empty>
              <RecipeResults date={date} query={filterQuery} />
              <Combobox.List className={css.list} render={<List />}>
                {(food: CalorieFood) => {
                  const grams = food.productSizeGrams ?? 100;
                  return (
                    <Combobox.Item
                      className={css.option}
                      key={food.id}
                      render={<ListItem interactive />}
                      value={food}
                    >
                      <FoodSummary
                        carbs={nutritionAtGrams(food.carbsPer100g, grams)}
                        category={food.category}
                        density='compact'
                        fat={nutritionAtGrams(food.fatPer100g, grams)}
                        imageUrl={food.imageUrl}
                        kcal={nutritionAtGrams(food.kcalPer100g, grams)}
                        meta={`${formatWhole(grams)} g`}
                        name={food.name}
                        protein={nutritionAtGrams(food.proteinPer100g, grams)}
                      />
                    </Combobox.Item>
                  );
                }}
              </Combobox.List>
              <div className={css.actions}>
                <Btn
                  icon={<PlusIcon aria-hidden='true' />}
                  isLink
                  render={
                    <Link
                      search={{ date, name: trimmedQuery || undefined }}
                      to='/calories/foods/new'
                    />
                  }
                  size='sm'
                  variant='ghost'
                >
                  {t({ en: 'Create new food', pl: 'Utwórz nowe jedzenie' })}
                </Btn>
                <Btn
                  icon={<ScanLineIcon aria-hidden='true' />}
                  isLink
                  render={<Link search={{ date }} to='/calories/scan' />}
                  size='sm'
                  variant='ghost'
                >
                  {t({ en: 'Scan barcode', pl: 'Skanuj kod kreskowy' })}
                </Btn>
              </div>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>

      <AddFoodDialog
        date={date}
        finalFocus={inputRef}
        food={linkedFood ?? pickedFood}
        onClose={closeDialog}
        onSaved={handleSaved}
      />
    </>
  );
}
