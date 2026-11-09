import { Combobox } from '@base-ui/react/combobox';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { BarcodeIcon, SearchIcon } from 'lucide-react';
import { useDeferredValue, useRef, useState } from 'react';
import type { CalorieFood } from '../calories.api';
import { calorieFoodQueryOptions, calorieFoodsQueryOptions } from '../calories.query';
import { AddFoodDialog } from './AddFoodDialog';
import { FoodSearchOption } from './FoodSearchOption';
import {
  foodSearchResultKey,
  foodSearchResultLabel,
  foodSearchResults,
  type FoodSearchResult,
} from './foodSearchResults';
import { Btn } from '@/components/ui/btn/Btn';
import { List } from '@/components/ui/list/List';
import { TextInput } from '@/components/ui/text-input/TextInput';
import css from './FoodSearch.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { recipeLibraryQueryOptions } from '@/pages/recipes/recipes.query';

type Props = {
  date: string;
  /** Food to open immediately, e.g. right after scanning or creating it. */
  linkedFoodId?: string;
};

/**
 * Searches foods and recipes through an accessible Base UI combobox. Picking a food opens the
 * amount dialog, so the most common way to log stays on the diary.
 */
export function FoodSearch({ date, linkedFoodId }: Props) {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const filterQuery = useDeferredValue(query);
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

  return (
    <>
      <Combobox.Root<FoodSearchResult>
        autoHighlight
        filter={null}
        inputValue={query}
        itemToStringLabel={(result) => foodSearchResultLabel(result, locale)}
        items={results}
        onInputValueChange={setQuery}
        onValueChange={(result) => {
          if (result) openResult(result);
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
            render={
              <TextInput
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
              />
            }
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
                {foodsQuery.isPending
                  ? null
                  : t({
                      en: 'No foods yet. Type a name to create one.',
                      pl: 'Brak produktów. Wpisz nazwę, aby utworzyć nowy.',
                    })}
              </Combobox.Empty>
              <Combobox.List className={css.list} render={<List />}>
                {(result: FoodSearchResult) => (
                  <FoodSearchOption key={foodSearchResultKey(result)} result={result} />
                )}
              </Combobox.List>
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
