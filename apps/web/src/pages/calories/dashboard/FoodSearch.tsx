import { useQuery } from '@tanstack/react-query';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
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
  /** Food whose amount dialog is open: picked here, or linked after scanning or creating it. */
  linkedFoodId?: string;
  /** The phone search takeover is open. */
  searchOpen: boolean;
};

/**
 * Searches foods and recipes through an accessible Base UI combobox: a dropdown with a mouse, a
 * full-screen takeover on touch. Picking a food opens the amount dialog, so the most common way to
 * log stays on the diary. Both sheets live in the URL, so the back gesture closes them like a
 * native app.
 */
export function FoodSearch({ date, linkedFoodId, searchOpen }: Props) {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  // True while the open sheet's history entry was pushed here, so closing can step back to it.
  const pushedSheet = useRef(false);
  const [query, setQuery] = useState('');
  const filterQuery = useDeferredValue(query);
  const [pickedFood, setPickedFood] = useState<CalorieFood | null>(null);
  const foodsQuery = useQuery(calorieFoodsQueryOptions());
  const recipesQuery = useQuery(recipeLibraryQueryOptions());
  const needsFetch = linkedFoodId !== undefined && pickedFood?.id !== linkedFoodId;
  const linkedFoodQuery = useQuery({
    ...calorieFoodQueryOptions(linkedFoodId ?? ''),
    enabled: needsFetch,
  });
  const results = foodSearchResults(
    foodsQuery.data ?? [],
    recipesQuery.data ?? [],
    filterQuery,
    locale,
  );
  const sheetOpen = searchOpen || linkedFoodId !== undefined;
  // A sheet closed by the back gesture already popped its entry.
  useEffect(() => {
    if (!sheetOpen) pushedSheet.current = false;
  }, [sheetOpen]);
  let dialogFood: CalorieFood | null = null;
  if (linkedFoodId !== undefined)
    dialogFood = needsFetch ? (linkedFoodQuery.data ?? null) : pickedFood;

  function openTakeover() {
    pushedSheet.current = true;
    void navigate({ resetScroll: false, search: { date, sheet: 'search' }, to: '/calories' });
  }

  /** Leaves a sheet: back when this page pushed its entry, otherwise replace it with the diary. */
  function closeSheet(nextDate = date) {
    if (pushedSheet.current && nextDate === date) {
      pushedSheet.current = false;
      router.history.back();
      return;
    }
    pushedSheet.current = false;
    void navigate({
      replace: true,
      resetScroll: nextDate !== date,
      search: { date: nextDate },
      to: '/calories',
    });
  }

  function openResult(result: FoodSearchResult) {
    setQuery('');
    // From the takeover, replace its entry so back skips the closed search.
    const replace = searchOpen;
    if (!searchOpen) pushedSheet.current = true;
    if (result.kind === 'food') {
      setPickedFood(result.food);
      void navigate({
        replace,
        resetScroll: false,
        search: { date, foodId: result.food.id },
        to: '/calories',
      });
    } else if (result.kind === 'recipe') {
      pushedSheet.current = false;
      void navigate({ replace, search: { date, recipeId: result.recipe.id }, to: '/calories/add' });
    } else {
      pushedSheet.current = false;
      void navigate({ replace, search: { date, name: result.name }, to: '/calories/foods/new' });
    }
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
          if (open) {
            openTakeover();
          } else {
            setQuery('');
            closeSheet();
          }
        }}
        open={searchOpen}
      />

      <AddFoodDialog
        date={date}
        finalFocus={inputRef}
        food={dialogFood}
        onClose={() => closeSheet()}
        onSaved={(savedDate) => closeSheet(savedDate)}
      />
    </>
  );
}
