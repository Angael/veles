import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import clsx from 'clsx';
import { useState } from 'react';
import { Card } from '@/components/Card';
import { recipesQueryOptions, DEFAULT_RECIPES_QUERY_INPUT } from './recipes.query';
import css from './recipes.module.css';

export const Route = createFileRoute('/recipes/')({
  loader: ({ context }) =>
    (
      context as { queryClient: import('@tanstack/react-query').QueryClient }
    ).queryClient.ensureQueryData(recipesQueryOptions(DEFAULT_RECIPES_QUERY_INPUT)),
  component: RecipesPage,
});

type NutritionField = 'none' | 'kcal' | 'protein' | 'carbs' | 'fats';
type FilterDirection = 'gte' | 'lte';

function RecipesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [nutritionField, setNutritionField] = useState<NutritionField>('none');
  const [nutritionDirection, setNutritionDirection] = useState<FilterDirection>('lte');
  const [nutritionValueInput, setNutritionValueInput] = useState('');
  const [ratingDirection, setRatingDirection] = useState<FilterDirection>('gte');
  const [ratingValueInput, setRatingValueInput] = useState('');

  const queryInput = {
    search,
    nutritionField,
    nutritionDirection,
    nutritionValue: parseOptionalNumber(nutritionValueInput),
    ratingDirection,
    ratingValue: parseOptionalNumber(ratingValueInput),
    userId: DEFAULT_RECIPES_QUERY_INPUT.userId,
  } as const;

  const { data } = useQuery(recipesQueryOptions(queryInput));
  const recipes = data?.recipes ?? [];

  return (
    <main className={css.page}>
      <section className={css.controls}>
        <label className={css.searchField}>
          <input
            autoComplete='off'
            className={css.searchInput}
            name='search'
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Search by name, tags, or description'
            type='search'
            value={search}
          />
        </label>

        <button
          className={css.filterToggle}
          onClick={() => setShowFilters((value) => !value)}
          type='button'
        >
          {showFilters ? 'Hide advanced filters' : 'Show advanced filters'}
        </button>

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
      </section>

      <section className={css.grid}>
        {recipes.map((recipe) => (
          <Card
            as='article'
            className={css.card}
            key={recipe.id}
            compact
            onClick={() => navigate({ to: '/recipes/view/$id', params: { id: recipe.id } })}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate({ to: '/recipes/view/$id', params: { id: recipe.id } });
              }
            }}
            role='link'
            tabIndex={0}
          >
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
                        <button
                          className={css.tag}
                          key={tag}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setSearch(tag);
                          }}
                          type='button'
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {recipe.description ? <p className={css.description}>{recipe.description}</p> : null}

              <div className={css.recipeFooter}>
                <span className={css.footerItem}>{recipe.rating}/5</span>
                {recipe.nutrition.kcal !== null ? (
                  <p className={css.footerItem}>{String(recipe.nutrition.kcal)} KCAL</p>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </section>

      <Link aria-label='Add recipe' className={css.floatingButton} to='/recipes/add'>
        Add recipe
      </Link>
    </main>
  );
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
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
