import { Link } from '@tanstack/react-router';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckIcon,
  DumbbellIcon,
  FlameIcon,
  ScaleIcon,
  UsersRoundIcon,
  UtensilsIcon,
} from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import type { HomeDashboardData } from './home.api';
import css from './HomeDashboard.module.css';

type HomeDashboardProps = {
  data: HomeDashboardData;
};

const todoPreview = [
  { done: true, label: 'Coffee beans' },
  { done: false, label: 'Plan the week' },
  { done: false, label: 'Pick up groceries' },
] as const;

export function HomeDashboard({ data }: HomeDashboardProps) {
  const latestWeight = data.weightEntries.at(-1);
  const previousWeight = data.weightEntries.at(-2);
  const delta =
    latestWeight && previousWeight ? latestWeight.weightKg - previousWeight.weightKg : null;
  const chartPoints = getChartPoints(data.weightEntries);
  const recommendedRecipes = getDailyRecommendations(data.recipes, data.date);

  return (
    <main className={css.page}>
      <div className={css.grid}>
        <Card as='article' className={css.weightTile} data-appear variant='primary'>
          <div className={css.tileHeading}>
            <h2>Weight</h2>
            <ScaleIcon aria-hidden='true' />
          </div>
          {latestWeight ? (
            <>
              <div className={css.weightValue}>
                <strong>{latestWeight.weightKg.toFixed(1)}</strong>
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
              <strong>Ready when you are.</strong>
              <p>Log your first weight to begin a trend built around you.</p>
            </div>
          )}
          <Btn className={css.tileAction} isLink render={<Link to='/weight' />} variant='text'>
            {latestWeight ? 'Go to Weight' : 'Log first weight'}
            <ArrowRightIcon aria-hidden='true' />
          </Btn>
        </Card>

        <Card as='article' className={css.foodTile} data-appear='1' shadow={false}>
          <div className={css.tileHeading}>
            <h2>Today’s food</h2>
            <FlameIcon aria-hidden='true' />
          </div>
          <div className={css.macroBars}>
            <MacroProgress
              label='kcal'
              total={data.nutrition.totals.kcal}
              goal={data.nutrition.goal?.kcal ?? null}
            />
            <MacroProgress
              label='protein'
              total={data.nutrition.totals.protein}
              goal={data.nutrition.goal?.protein ?? null}
              unit='g'
            />
            <MacroProgress
              label='fat'
              total={data.nutrition.totals.fat}
              goal={data.nutrition.goal?.fat ?? null}
              unit='g'
            />
            <MacroProgress
              label='carbs'
              total={data.nutrition.totals.carbs}
              goal={data.nutrition.goal?.carbs ?? null}
              unit='g'
            />
          </div>
          <Btn className={css.tileAction} isLink render={<Link to='/calories' />} variant='text'>
            Log food
            <ArrowRightIcon aria-hidden='true' />
          </Btn>
        </Card>

        <Card as='section' className={css.recipeTile} data-appear='2' shadow={false}>
          <div className={css.tileHeading}>
            <h2>Recommended recipes for today</h2>
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
          <Btn className={css.tileAction} isLink render={<Link to='/recipes' />} variant='text'>
            Browse all recipes
            <ArrowRightIcon aria-hidden='true' />
          </Btn>
        </Card>

        <Card as='article' className={css.todosTile} data-appear='3' shadow={false}>
          <div className={css.tileHeading}>
            <h2>Todos</h2>
            <CheckIcon aria-hidden='true' />
          </div>
          <ul className={css.todoList}>
            {todoPreview.map((todo) => (
              <li key={todo.label} className={todo.done ? css.todoDone : undefined}>
                <span aria-hidden='true'>{todo.done ? '✓' : ''}</span>
                {todo.label}
              </li>
            ))}
          </ul>
          <Btn className={css.tileAction} isLink render={<Link to='/todos' />} variant='text'>
            Go to Todos
            <ArrowRightIcon aria-hidden='true' />
          </Btn>
        </Card>

        <Card as='article' className={css.diaryTile} data-appear='4' shadow={false}>
          <div className={css.tileHeading}>
            <h2>Diary</h2>
            <BookOpenIcon aria-hidden='true' />
          </div>
          <div className={css.diaryReadout}>{formatDiaryDistance(data.lastDiaryEntryDate)}</div>
          <div className={css.diaryLines} aria-hidden='true'>
            <i />
            <i />
            <i />
          </div>
          <Btn className={css.tileAction} isLink render={<Link to='/diary' />} variant='text'>
            Go to Diary
            <ArrowRightIcon aria-hidden='true' />
          </Btn>
        </Card>

        <Card as='article' className={css.familyTile} data-appear='5' shadow={false}>
          <div className={css.tileHeading}>
            <h2>Family and friends</h2>
            <UsersRoundIcon aria-hidden='true' />
          </div>
          <p>A shared corner for the people you choose. Nothing leaves your orbit by default.</p>
          <div className={css.orbitPeople} aria-hidden='true'>
            <i />
            <i />
            <i />
            <i />
          </div>
        </Card>

        <Card as='article' className={css.workoutTile} data-appear='6' shadow={false}>
          <div className={css.tileHeading}>
            <h2>Workout log</h2>
            <DumbbellIcon aria-hidden='true' />
          </div>
          <p>Last sessions and training notes will slot into this rhythm later.</p>
          <div className={css.repRail} aria-hidden='true'>
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </Card>
      </div>
    </main>
  );
}

function MacroProgress({
  label,
  total,
  goal,
  unit = '',
}: {
  label: 'kcal' | 'protein' | 'fat' | 'carbs';
  total: number;
  goal: number | null;
  unit?: string;
}) {
  const maximum = goal ?? Math.max(total, 1);

  return (
    <div className={css.macroProgress}>
      <div>
        <span>{label}</span>
        <strong>
          {Math.round(total)}
          {unit}
          <small>{goal === null ? 'No goal' : ` / ${Math.round(goal)}${unit}`}</small>
        </strong>
      </div>
      <progress aria-label={`${label} progress`} max={maximum} value={Math.min(total, maximum)} />
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
