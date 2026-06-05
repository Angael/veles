import { useQuery } from '@tanstack/react-query';
import { useThrottledValue } from '@tanstack/react-pacer';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { ListFilterIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { FloatingButton } from '@/components/floating-button/FloatingButton';
import { DEFAULT_RECIPES_QUERY_INPUT, recipesQueryOptions } from './recipes.query';
import css from './RecipesPage.module.css';

type NutritionField = 'none' | 'kcal' | 'protein' | 'carbs' | 'fats';
type FilterDirection = 'gte' | 'lte';

export function RecipesPage() {
  const [searchInputValue, setSearchInputValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [nutritionField, setNutritionField] = useState<NutritionField>('none');
  const [nutritionDirection, setNutritionDirection] = useState<FilterDirection>('lte');
  const [nutritionValueInput, setNutritionValueInput] = useState('');
  const [ratingDirection, setRatingDirection] = useState<FilterDirection>('gte');
  const [ratingValueInput, setRatingValueInput] = useState('');
  const [search] = useThrottledValue(searchInputValue, { wait: 200 });

  const queryInput = {
    search,
    nutritionField,
    nutritionDirection,
    nutritionValue: parseOptionalNumber(nutritionValueInput),
    ratingDirection,
    ratingValue: parseOptionalNumber(ratingValueInput),
    userId: DEFAULT_RECIPES_QUERY_INPUT.userId,
  } as const;

  const { data, error } = useQuery(recipesQueryOptions(queryInput));
  const recipes = data?.recipes ?? [];

  return (
    <main className={css.page}>
      <section className={css.controls}>
        <div className={css.toolbar}>
          <label className={css.searchField}>
            <input
              aria-label='Search recipes'
              autoComplete='off'
              className={css.searchInput}
              name='search'
              onChange={(event) => setSearchInputValue(event.target.value)}
              placeholder='Search by name, tags, or description'
              type='search'
              value={searchInputValue}
            />
          </label>

          <Btn
            aria-label={showFilters ? 'Hide advanced filters' : 'Show advanced filters'}
            className={css.filterToggle}
            icon={<ListFilterIcon aria-hidden='true' size={18} strokeWidth={1.8} />}
            onClick={() => setShowFilters((value) => !value)}
            radius='pill'
            type='button'
            variant='secondary'
          >
            <span className={css.desktopLabel}>
              {showFilters ? 'Hide advanced filters' : 'Show advanced filters'}
            </span>
          </Btn>
        </div>

        {showFilters ? (
          <div className={css.filtersPanel}>
            <label className={css.filterField}>
              <span>Nutrition field</span>
              <select
                className={css.selectInput}
                onChange={(event) => setNutritionField(event.target.value as NutritionField)}
                value={nutritionField}
              >
                <option value='none'>Disabled</option>
                <option value='kcal'>Kcal</option>
                <option value='protein'>Protein</option>
                <option value='carbs'>Carbs</option>
                <option value='fats'>Fats</option>
              </select>
            </label>

            <label className={css.filterField}>
              <span>Nutrition comparison</span>
              <select
                className={css.selectInput}
                onChange={(event) => setNutritionDirection(event.target.value as FilterDirection)}
                value={nutritionDirection}
              >
                <option value='lte'>Less than or equal</option>
                <option value='gte'>More than or equal</option>
              </select>
            </label>

            <label className={css.filterField}>
              <span>Nutrition value</span>
              <input
                className={css.numberInput}
                inputMode='numeric'
                min='0'
                onChange={(event) => setNutritionValueInput(event.target.value)}
                placeholder='e.g. 500'
                type='number'
                value={nutritionValueInput}
              />
            </label>

            <label className={css.filterField}>
              <span>Rating comparison</span>
              <select
                className={css.selectInput}
                onChange={(event) => setRatingDirection(event.target.value as FilterDirection)}
                value={ratingDirection}
              >
                <option value='gte'>More than or equal</option>
                <option value='lte'>Less than or equal</option>
              </select>
            </label>

            <label className={css.filterField}>
              <span>Rating value</span>
              <input
                className={css.numberInput}
                inputMode='numeric'
                max='5'
                min='0'
                onChange={(event) => setRatingValueInput(event.target.value)}
                placeholder='e.g. 4'
                step='1'
                type='number'
                value={ratingValueInput}
              />
            </label>
          </div>
        ) : null}

        {error?.message ? (
          <ErrorCard
            className={css.errorCard}
            message={error.message}
            title='Could not load recipes'
          />
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
            <Card as='article' className={css.card} compact>
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
