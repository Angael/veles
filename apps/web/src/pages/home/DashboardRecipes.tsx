import { Link } from '@tanstack/react-router';
import { Btn } from '@/components/ui/btn/Btn';
import type { HomeDashboardData } from './home.api';
import css from './HomeDashboard.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type DashboardRecipesProps = {
  recipes: HomeDashboardData['recipes'];
  date: string;
};

export function DashboardRecipes({ recipes, date }: DashboardRecipesProps) {
  const { formatNumber, t } = useI18n();
  const recommendedRecipes = getDailyRecommendations(recipes, date);

  return (
    <div className={css.recipeStack}>
      {recommendedRecipes.length ? (
        recommendedRecipes.map((recipe) => (
          <Link
            className={css.recipe}
            key={recipe.id}
            params={{ id: recipe.id }}
            to='/recipes/view/$id'
          >
            <div>
              <strong>{recipe.name}</strong>
              <small>
                {recipe.kcal === null
                  ? t({ en: 'Nutrition not set', pl: 'Brak wartości odżywczych' })
                  : `${formatNumber(recipe.kcal)} kcal`}
              </small>
            </div>
          </Link>
        ))
      ) : (
        <div className={css.emptyRecipes}>
          <p>
            {t({
              en: 'Save a recipe to get a fresh daily selection here.',
              pl: 'Zapisz przepis, aby codziennie widzieć tu nowy wybór.',
            })}
          </p>
          <Btn isLink render={<Link to='/recipes/add' />} variant='outlineMain'>
            {t({ en: 'Add the first', pl: 'Dodaj pierwszy' })}
          </Btn>
        </div>
      )}
    </div>
  );
}

/** Rotates through a stable pseudo-random order so the selection changes with each local date. */
function getDailyRecommendations(recipes: HomeDashboardData['recipes'], date: string) {
  if (!recipes.length) return [];
  const ordered = recipes
    .map((recipe) => ({ recipe, score: hashString(recipe.id) }))
    .toSorted((a, b) => a.score - b.score || a.recipe.id.localeCompare(b.recipe.id))
    .map(({ recipe }) => recipe);
  const day = hashString(date);
  const startIndex = Math.abs(day) % ordered.length;

  return [...ordered.slice(startIndex), ...ordered.slice(0, startIndex)].slice(0, 3);
}

function hashString(value: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}
