import { useQuery } from '@tanstack/react-query';
import { useThrottledValue } from '@tanstack/react-pacer';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { ListFilterIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { ErrorCard } from '@/components/error-card/ErrorCard';
import { FloatingButton } from '@/components/floating-button/FloatingButton';
import { NumberInput } from '@/components/number-input/NumberInput';
import { SelectInput } from '@/components/select-input/SelectInput';
import { TextInput } from '@/components/text-input/TextInput';
import type { RecipesQueryInput } from './recipes.data';
import { recipesQueryOptions } from './recipes.query';
import css from './RecipesPage.module.css';

type FilterDirection = 'gte' | 'lte';

const NUTRITION_DIRECTION_OPTIONS = [
  { label: 'Less than or equal', value: 'lte' },
  { label: 'More than or equal', value: 'gte' },
] as const satisfies readonly { label: string; value: FilterDirection }[];

const RATING_DIRECTION_OPTIONS = [
  { label: 'More than or equal', value: 'gte' },
  { label: 'Less than or equal', value: 'lte' },
] as const satisfies readonly { label: string; value: FilterDirection }[];

const FILTERS_PANEL_ID = 'recipes-filters-panel';

export function RecipesPage() {
  const [searchInputValue, setSearchInputValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [nutritionDirection, setNutritionDirection] = useState<FilterDirection>('lte');
  const [nutritionValue, setNutritionValue] = useState<number | null>(null);
  const [ratingDirection, setRatingDirection] = useState<FilterDirection>('gte');
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [search] = useThrottledValue(searchInputValue, { wait: 200 });

  const queryInput = {
    search,
    nutritionDirection,
    nutritionValue,
    ratingDirection,
    ratingValue,
  } satisfies RecipesQueryInput;

  const { data, error } = useQuery(recipesQueryOptions(queryInput));
  const recipes = data?.recipes ?? [];

  return (
    <main className={css.page}>
      <title>Recipes</title>
      <section className={css.controls}>
        <div className={css.toolbar}>
          <label className={css.searchField}>
            <TextInput
              aria-label='Search recipes'
              autoComplete='off'
              className={css.searchInput}
              name='search'
              onValueChange={setSearchInputValue}
              placeholder='Search by name, tags, or description'
              type='search'
              value={searchInputValue}
            />
          </label>

          <Btn
            aria-controls={FILTERS_PANEL_ID}
            aria-expanded={showFilters}
            aria-label='advanced filters'
            className={css.filterToggle}
            icon={<ListFilterIcon aria-hidden='true' size={18} strokeWidth={1.8} />}
            iconOnly
            onClick={() => setShowFilters((value) => !value)}
            radius='pill'
            type='button'
            variant='secondary'
          ></Btn>
        </div>

        <div
          aria-hidden={!showFilters}
          className={css.filtersPanel}
          hidden={!showFilters}
          id={FILTERS_PANEL_ID}
        >
          <label className={css.filterField}>
            <span>Kcal comparison</span>
            <SelectInput
              aria-label='Kcal comparison'
              className={css.selectInput}
              items={NUTRITION_DIRECTION_OPTIONS}
              onValueChange={(value) => {
                if (value !== null) {
                  setNutritionDirection(value);
                }
              }}
              value={nutritionDirection}
            />
          </label>

          <label className={css.filterField}>
            <span>Kcal value</span>
            <NumberInput
              className={css.numberInput}
              min={0}
              onValueChange={setNutritionValue}
              placeholder='e.g. 500'
              step={100}
              value={nutritionValue}
            />
          </label>

          <label className={css.filterField}>
            <span>Rating comparison</span>
            <SelectInput
              aria-label='Rating comparison'
              className={css.selectInput}
              items={RATING_DIRECTION_OPTIONS}
              onValueChange={(value) => {
                if (value !== null) {
                  setRatingDirection(value);
                }
              }}
              value={ratingDirection}
            />
          </label>

          <label className={css.filterField}>
            <span>Rating value</span>
            <NumberInput
              className={css.numberInput}
              max={5}
              min={0}
              onValueChange={setRatingValue}
              placeholder='e.g. 4'
              step={1}
              value={ratingValue}
            />
          </label>
        </div>

        {error?.message ? (
          <ErrorCard message={error.message} title='Could not load recipes' />
        ) : null}

        {error?.message ? (
          <ErrorCard message={error.message} title='Could not load recipes' />
        ) : null}
      </section>

      <section className={css.grid}>
        {recipes.map((recipe) => (
          <Link
            className={css.cardLink}
            key={recipe.id}
            params={{ id: recipe.id }}
            to='/recipes/view/$id'
          >
            <Card as='article' className={css.card}>
              {recipe.images.length > 0 ? (
                <div className={clsx(css.imageLayout, getImageLayoutClass(recipe.images.length))}>
                  {recipe.images.slice(0, 3).map((image, index) => (
                    <img
                      alt=''
                      className={css.recipeImage}
                      key={`${recipe.id}-${index}`}
                      src={image.url}
                    />
                  ))}
                </div>
              ) : null}

              <div className={css.cardBody}>
                <div className={css.cardHeader}>
                  <div className={css.titleBlock}>
                    <h2>{recipe.name}</h2>

                    {recipe.tags.length > 0 ? (
                      <div className={css.tags}>
                        {recipe.tags.map((tag) => (
                          <span className={css.tag} key={tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {recipe.description ? (
                  <p className={css.description}>{recipe.description}</p>
                ) : null}

                <div className={css.recipeFooter}>
                  <span className={css.footerItem}>{recipe.rating}/5</span>
                  {recipe.nutrition.kcal !== null ? (
                    <p className={css.footerItem}>{String(recipe.nutrition.kcal)} KCAL</p>
                  ) : null}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </section>

      <FloatingButton
        icon={<PlusIcon aria-hidden='true' size={18} strokeWidth={1.8} />}
        to='/recipes/add'
      >
        Add recipe
      </FloatingButton>
    </main>
  );
}

function getImageLayoutClass(imageCount: number) {
  if (imageCount >= 3) {
    return css.imageLayoutThree;
  }

  if (imageCount === 2) {
    return css.imageLayoutTwo;
  }

  return css.imageLayoutOne;
}
