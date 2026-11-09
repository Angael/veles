import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useDeferredValue, useRef, useState } from 'react';
import type { CalorieFood } from '../calories.api';
import { calorieFoodQueryOptions, calorieFoodsQueryOptions } from '../calories.query';
import { AddFoodDialog } from './AddFoodDialog';
import { FoodSearchCombobox } from './FoodSearchCombobox';
import { FoodSearchTakeover } from './FoodSearchTakeover';
import { foodSearchResults, type FoodSearchResult } from './foodSearchResults';
import css from './FoodSearch.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { recipeLibraryQueryOptions } from '@/pages/recipes/recipes.query';

type Props = {
  date: string;
  /** Food to open immediately, e.g. right after scanning or creating it. */
  linkedFoodId?: string;
};

/**
 * Searches foods and recipes through an accessible Base UI combobox: a dropdown with a mouse, a
 * full-screen takeover on touch. Picking a food opens the amount dialog, so the most common way to
 * log stays on the diary.
 */
export function FoodSearch({ date, linkedFoodId }: Props) {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const filterQuery = useDeferredValue(query);
  const [takeoverOpen, setTakeoverOpen] = useState(false);
  const [pickedFood, setPickedFood] = useState<CalorieFood | null>(null);
  const foodsQuery = useQuery(calorieFoodsQueryOptions());
  const recipesQuery = useQuery(recipeLibraryQueryOptions());
  const linkedFoodQuery = useQuery({
    ...calorieFoodQueryOptions(linkedFoodId ?? ''),
    enabled: linkedFoodId !== undefined,
  });
  const results = foodSearchResults(
    foodsQuery.data ?? [],
    recipesQuery.data ?? [],
    filterQuery,
    locale,
  );
  const linkedFood = linkedFoodId === undefined ? undefined : linkedFoodQuery.data;

  function openResult(result: FoodSearchResult) {
    setQuery('');
    setTakeoverOpen(false);
    if (result.kind === 'food') {
      setPickedFood(result.food);
    } else if (result.kind === 'recipe') {
      void navigate({ search: { date, recipeId: result.recipe.id }, to: '/calories/add' });
    } else {
      void navigate({ search: { date, name: result.name }, to: '/calories/foods/new' });
    }
  }

  function closeDialog() {
    setPickedFood(null);
    if (linkedFoodId === undefined) return;
    void navigate({ replace: true, resetScroll: false, search: { date }, to: '/calories' });
  }

  function handleSaved(savedDate: string) {
    setPickedFood(null);
    if (savedDate === date && linkedFoodId === undefined) return;
    void navigate({
      replace: true,
      resetScroll: savedDate !== date,
      search: { date: savedDate },
      to: '/calories',
    });
  }

  const comboboxProps = {
    date,
    fetching: foodsQuery.isFetching,
    loading: foodsQuery.isPending,
    onPick: openResult,
    onQueryChange: setQuery,
    query,
    results,
  };

  return (
    <>
      <div className={css.desktopOnly}>
        <FoodSearchCombobox {...comboboxProps} inputRef={inputRef} />
      </div>
      <FoodSearchTakeover
        {...comboboxProps}
        onOpenChange={(open) => {
          setTakeoverOpen(open);
          if (!open) setQuery('');
        }}
        open={takeoverOpen}
      />

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
