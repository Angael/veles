import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
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
          <Link
            className={css.cardLink}
            key={recipe.id}
            to='/recipes/view/$id'
            params={{ id: recipe.id }}
          >
            <Card as='article' className={css.card} compact>
              <div className={css.imageLayout}>
                {recipe.images[0] ? (
                  <div className={css.mainImageWrap}>
                    <img alt='' className={css.mainImage} src={recipe.images[0].url} />
                  </div>
                ) : null}

                {recipe.images[1] || recipe.images[2] ? (
                  <div className={css.sideImages}>
                    {recipe.images[1] ? (
                      <div className={css.sideImageWrap}>
                        <img alt='' className={css.sideImage} src={recipe.images[1].url} />
                      </div>
                    ) : null}
                    {recipe.images[2] ? (
                      <div className={css.sideImageWrap}>
                        <img alt='' className={css.sideImage} src={recipe.images[2].url} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className={css.cardBody}>
                <div className={css.cardHeader}>
                  <h2>{recipe.name}</h2>
                </div>

                <div className={css.tags}>
                  {recipe.tags.map((tag) => (
                    <span className={css.tag} key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>

                <p className={css.description}>{recipe.description}</p>

                <div className={css.recipeFooter}>
                  <span className={css.footerItem}>{recipe.rating}/5</span>
                  <p className={css.footerItem}>
                    {recipe.nutrition.kcal === null ? 'N/A' : String(recipe.nutrition.kcal)} KCAL
                  </p>
                </div>
              </div>
            </Card>
          </Link>
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
