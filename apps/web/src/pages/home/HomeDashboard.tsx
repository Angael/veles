import { Link } from '@tanstack/react-router';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import {
  BookOpenIcon,
  CheckIcon,
  FlameIcon,
  ScaleIcon,
  UsersRoundIcon,
  UtensilsIcon,
} from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { CountUp } from '@/components/ui/count-up/CountUp';
import type { HomeDashboardData } from './home.api';
import css from './HomeDashboard.module.css';

type HomeDashboardProps = {
  data: HomeDashboardData;
};

export function HomeDashboard({ data }: HomeDashboardProps) {
  const latestWeight = data.weightEntries.at(-1);
  const previousWeight = data.weightEntries.at(-2);
  const delta =
    latestWeight && previousWeight ? latestWeight.weightKg - previousWeight.weightKg : null;
  const chartPoints = getChartPoints(data.weightEntries);
  const recommendedRecipes = getDailyRecommendations(data.recipes, data.date);
  const kcal = data.nutrition.totals.kcal;

  return (
    <main className={css.page}>
      <div className={css.grid}>
        <Card
          as='article'
          className={css.foodTile}
          data-accent='calories'
          data-appear
          shadow={false}
          tone='accent'
        >
          <div className={css.tileHeading}>
            <h2>Today’s food</h2>
            <FlameIcon aria-hidden='true' />
          </div>
          <div className={css.nutrition}>
            <div className={css.kcal}>
              <div className={css.kcalValue}>
                <CountUp className={css.kcalNumber} value={Math.round(kcal)} />
                <span>kcal</span>
                <small>
                  {data.nutrition.goal ? `of ${Math.round(data.nutrition.goal.kcal)}` : 'No goal'}
                </small>
              </div>
              <NutritionProgress
                goal={data.nutrition.goal?.kcal ?? null}
                label='kcal'
                total={kcal}
              />
            </div>
            <div className={css.macros}>
              <MacroProgress
                label='protein'
                total={data.nutrition.totals.protein}
                goal={data.nutrition.goal?.protein ?? null}
              />
              <MacroProgress
                label='fat'
                total={data.nutrition.totals.fat}
                goal={data.nutrition.goal?.fat ?? null}
              />
              <MacroProgress
                label='carbs'
                total={data.nutrition.totals.carbs}
                goal={data.nutrition.goal?.carbs ?? null}
              />
            </div>
          </div>
          <Link aria-label='Open Today’s food' className={css.cardLink} to='/calories' />
        </Card>

        <Card
          as='article'
          className={css.weightTile}
          data-accent='weight'
          data-appear='1'
          shadow={false}
          tone='accent'
        >
          <div className={css.tileHeading}>
            <h2>Weight</h2>
            <ScaleIcon aria-hidden='true' />
          </div>
          {latestWeight ? (
            <>
              <div className={css.weightValue}>
                <CountUp
                  className={css.weightNumber}
                  decimals={1}
                  from={latestWeight.weightKg - 3}
                  value={latestWeight.weightKg}
                />
                <span>kg</span>
              </div>
              <div className={css.chart}>
                {chartPoints ? (
                  <svg aria-label='Recent weight trend' role='img' viewBox='0 0 300 96'>
                    <defs>
                      <linearGradient id='dashboard-weight-fill' x1='0' x2='0' y1='0' y2='1'>
                        <stop offset='0' stopColor='var(--c-accent)' stopOpacity='0.3' />
                        <stop offset='1' stopColor='var(--c-accent)' stopOpacity='0' />
                      </linearGradient>
                    </defs>
                    <polygon points={`0,96 ${chartPoints} 300,96`} />
                    <polyline points={chartPoints} />
                  </svg>
                ) : (
                  <div className={css.singlePoint} />
                )}
              </div>
              <div className={css.weightMeta}>
                <span>{format(parseISO(latestWeight.date), 'MMM d')}</span>
                <span>{formatDelta(delta)}</span>
              </div>
            </>
          ) : (
            <div className={css.emptyWeight}>
              <strong>No weight logged yet</strong>
              <p>Log your first weight to see your trend.</p>
            </div>
          )}
          <Link aria-label='Open Weight' className={css.cardLink} to='/weight' />
        </Card>

        <Card
          as='section'
          className={css.recipeTile}
          data-accent='recipes'
          data-appear='2'
          shadow={false}
        >
          <div className={css.tileHeading}>
            <h2>Recipes for today</h2>
            <UtensilsIcon aria-hidden='true' />
          </div>
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
                      {recipe.kcal === null ? 'Nutrition not set' : `${recipe.kcal} kcal`}
                    </small>
                  </div>
                </Link>
              ))
            ) : (
              <div className={css.emptyRecipes}>
                <p>Save a recipe to get a fresh daily selection here.</p>
                <Btn isLink render={<Link to='/recipes/add' />} variant='outlineMain'>
                  Add the first
                </Btn>
              </div>
            )}
          </div>
          <Link aria-label='Browse recipes' className={css.cardLink} to='/recipes' />
        </Card>

        <Card
          as='article'
          className={css.todosTile}
          data-accent='todos'
          data-appear='3'
          shadow={false}
        >
          <div className={css.tileHeading}>
            <h2>Todos</h2>
            <CheckIcon aria-hidden='true' />
          </div>
          <p>View your list</p>
          <Link aria-label='Open Todos' className={css.cardLink} to='/todos' />
        </Card>

        <Card
          as='article'
          className={css.diaryTile}
          data-accent='diary'
          data-appear='4'
          shadow={false}
        >
          <div className={css.tileHeading}>
            <h2>Diary</h2>
            <BookOpenIcon aria-hidden='true' />
          </div>
          <div className={css.diaryReadout}>{formatDiaryDistance(data.lastDiaryEntryDate)}</div>
          <Link aria-label='Open Diary' className={css.cardLink} to='/diary' />
        </Card>

        <Card
          as='article'
          className={css.familyTile}
          data-accent='account'
          data-appear='5'
          shadow={false}
        >
          <div className={css.tileHeading}>
            <h2>Family and friends</h2>
            <UsersRoundIcon aria-hidden='true' />
          </div>
          <p>Manage your connections in Account</p>
          <Link
            aria-label='Open Family and friends in Account'
            className={css.cardLink}
            to='/account'
          />
        </Card>
      </div>
    </main>
  );
}

function MacroProgress({
  label,
  total,
  goal,
}: {
  label: 'protein' | 'fat' | 'carbs';
  total: number;
  goal: number | null;
}) {
  return (
    <div className={css.macroProgress}>
      <div className={css.macroHeading}>
        <span>{label}</span>
        <strong>
          <CountUp value={Math.round(total)} />g
        </strong>
        <small>{goal === null ? 'No goal' : `of ${Math.round(goal)}g`}</small>
      </div>
      <NutritionProgress goal={goal} label={label} total={total} />
    </div>
  );
}

/** Overlays excess from the start of the filled track, as on the calories page. */
function NutritionProgress({
  label,
  total,
  goal,
}: {
  label: 'kcal' | 'protein' | 'fat' | 'carbs';
  total: number;
  goal: number | null;
}) {
  const maximum = goal === null ? Math.max(total, 1) : Math.max(goal, 1);

  return (
    <div className={css.progressTrack}>
      <progress
        aria-label={`${label} progress`}
        aria-valuetext={
          goal !== null && total > goal
            ? `${Math.round(total)} of ${Math.round(goal)}${label === 'kcal' ? ' kcal' : 'g'}`
            : undefined
        }
        max={maximum}
        value={Math.min(total, maximum)}
      />
      {goal !== null && total > goal && (
        <progress
          aria-hidden='true'
          className={css.overfill}
          max={maximum}
          value={Math.min(total - goal, maximum)}
        />
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

/** Maps the recent series into points for the fixed bento sparkline view box. */
function getChartPoints(entries: HomeDashboardData['weightEntries']) {
  if (entries.length < 2) return '';
  const weights = entries.map((entry) => entry.weightKg);
  const min = Math.min(...weights);
  const spread = Math.max(Math.max(...weights) - min, 0.1);
  return weights
    .map(
      (weight, index) =>
        `${(index / (weights.length - 1)) * 300},${88 - ((weight - min) / spread) * 76}`,
    )
    .join(' ');
}

function formatDelta(delta: number | null) {
  if (delta === null) return 'First point';
  if (Math.abs(delta) < 0.05) return 'Steady';
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`;
}

/** Turns the latest diary date into a private, content-free activity signal. */
function formatDiaryDistance(entryDate: string | null) {
  if (!entryDate) return 'No notes yet';
  const days = differenceInCalendarDays(new Date(), parseISO(entryDate));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day since last note';
  return `${days} days since last note`;
}
