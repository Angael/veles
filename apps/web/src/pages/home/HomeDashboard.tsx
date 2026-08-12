import { Link } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import {
  ArrowRightIcon,
  DumbbellIcon,
  FlameIcon,
  PlusIcon,
  ScaleIcon,
  StarIcon,
  UtensilsIcon,
} from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import type { SessionUser } from '@/lib/auth/session.api';
import type { HomeDashboardData } from './home.api';
import css from './HomeDashboard.module.css';

type HomeDashboardProps = {
  data: HomeDashboardData;
  user: SessionUser;
};

export function HomeDashboard({ data, user }: HomeDashboardProps) {
  const firstName = user.name.trim().split(/\s+/)[0] || 'there';
  const latestWeight = data.weightEntries.at(-1);
  const previousWeight = data.weightEntries.at(-2);
  const weightDelta =
    latestWeight && previousWeight ? latestWeight.weightKg - previousWeight.weightKg : null;
  const chartPoints = getChartPoints(data.weightEntries);

  return (
    <main className={css.page}>
      <header className={css.intro}>
        <div>
          <h1>Good to see you, {firstName}.</h1>
          <p>Your latest records, gathered into a quiet daily brief.</p>
        </div>
        <div className={css.actions}>
          <Btn
            icon={<PlusIcon aria-hidden='true' size={18} />}
            isLink
            render={<Link to='/weight/add' />}
            variant='main'
          >
            Log weight
          </Btn>
          <Btn isLink render={<Link to='/recipes' />} variant='outlineMain'>
            Open recipes
          </Btn>
        </div>
      </header>

      <section className={css.leadGrid} aria-label='Latest overview'>
        <Card as='article' className={css.weightFeature} shadow={false} variant='primary'>
          <div className={css.featureHeading}>
            <div>
              <span>Latest measure</span>
              <h2>Weight, in the long view</h2>
            </div>
            <ScaleIcon aria-hidden='true' />
          </div>

          {latestWeight ? (
            <>
              <div className={css.weightReading}>
                <strong>{latestWeight.weightKg.toFixed(1)}</strong>
                <span>kg</span>
                <small>{format(parseISO(latestWeight.date), 'MMM d')}</small>
              </div>
              <div className={css.trendWrap}>
                {chartPoints ? (
                  <svg aria-label='Recent weight trend' role='img' viewBox='0 0 240 72'>
                    <polyline points={chartPoints} />
                  </svg>
                ) : (
                  <div className={css.singlePoint} aria-hidden='true' />
                )}
                <p>{formatDelta(weightDelta)}</p>
              </div>
            </>
          ) : (
            <div className={css.emptyFeature}>
              <strong>No measurements yet.</strong>
              <p>Your first entry will start the trend.</p>
            </div>
          )}

          <Link className={css.inlineLink} to='/weight'>
            View weight history <ArrowRightIcon aria-hidden='true' />
          </Link>
        </Card>

        <Card as='aside' className={css.roadmap} shadow={false}>
          <h2>What is taking shape</h2>
          <div className={css.roadmapItem}>
            <FlameIcon aria-hidden='true' />
            <div>
              <strong>Food logging</strong>
              <span>In progress</span>
              <p>Meals, calories, and macros will join this daily brief.</p>
            </div>
          </div>
          <div className={css.roadmapItem}>
            <DumbbellIcon aria-hidden='true' />
            <div>
              <strong>Workouts</strong>
              <span>Planned</span>
              <p>Recent sessions will land here when training logs arrive.</p>
            </div>
          </div>
        </Card>
      </section>

      <section className={css.recipes} aria-labelledby='recent-recipes-title'>
        <header className={css.sectionHeading}>
          <div>
            <span>{String(data.recentRecipes.length).padStart(2, '0')} recent</span>
            <h2 id='recent-recipes-title'>From your recipe book</h2>
          </div>
          <Link className={css.inlineLink} to='/recipes'>
            Browse all <ArrowRightIcon aria-hidden='true' />
          </Link>
        </header>

        <div className={css.recipeList}>
          {data.recentRecipes.length ? (
            data.recentRecipes.map((recipe, index) => (
              <Link
                className={css.recipe}
                key={recipe.id}
                params={{ id: recipe.id }}
                to='/recipes/view/$id'
              >
                <span className={css.recipeIndex}>0{index + 1}</span>
                <div className={css.recipeCopy}>
                  <h3>{recipe.name}</h3>
                  <p>{recipe.description || 'A saved recipe ready for the next meal.'}</p>
                  <span>Updated {format(parseISO(recipe.updatedAt), 'MMM d')}</span>
                </div>
                <RecipeDetails recipe={recipe} />
                <ArrowRightIcon aria-hidden='true' className={css.recipeArrow} />
              </Link>
            ))
          ) : (
            <Card className={css.emptyRecipes} shadow={false}>
              <UtensilsIcon aria-hidden='true' />
              <div>
                <h3>Your recipe book is empty.</h3>
                <p>Add a recipe and it will appear in your daily brief.</p>
              </div>
              <Btn isLink render={<Link to='/recipes/add' />} variant='outlineMain'>
                Add recipe
              </Btn>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}

function RecipeDetails({ recipe }: { recipe: HomeDashboardData['recentRecipes'][number] }) {
  return (
    <div className={css.recipeDetails}>
      {recipe.rating ? (
        <span className={css.rating}>
          <StarIcon aria-hidden='true' /> {recipe.rating}/5
        </span>
      ) : null}
      <dl>
        <div>
          <dt>kcal</dt>
          <dd>{recipe.kcal ?? '—'}</dd>
        </div>
        <div>
          <dt>protein</dt>
          <dd>{recipe.protein === null ? '—' : `${recipe.protein}g`}</dd>
        </div>
        <div>
          <dt>fat</dt>
          <dd>{recipe.fat === null ? '—' : `${recipe.fat}g`}</dd>
        </div>
        <div>
          <dt>carbs</dt>
          <dd>{recipe.carbs === null ? '—' : `${recipe.carbs}g`}</dd>
        </div>
      </dl>
    </div>
  );
}

/** Maps recent measurements into a compact, zero-allocation SVG trend string. */
function getChartPoints(entries: HomeDashboardData['weightEntries']) {
  if (entries.length < 2) return '';
  const weights = entries.map((entry) => entry.weightKg);
  const min = Math.min(...weights);
  const spread = Math.max(Math.max(...weights) - min, 0.1);
  return weights
    .map(
      (weight, index) =>
        `${(index / (weights.length - 1)) * 240},${68 - ((weight - min) / spread) * 60}`,
    )
    .join(' ');
}

function formatDelta(delta: number | null) {
  if (delta === null) return 'Add another entry to reveal direction.';
  if (Math.abs(delta) < 0.05) return 'Holding steady since the previous entry.';
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg since the previous entry.`;
}
