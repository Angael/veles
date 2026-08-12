import { Link } from '@tanstack/react-router';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckIcon,
  DumbbellIcon,
  FlameIcon,
  ScaleIcon,
  StarIcon,
  UsersRoundIcon,
  UtensilsIcon,
} from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import revealCss from '@/components/reveal/Reveal.module.css';
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

  return (
    <main className={css.page}>
      <div className={css.grid}>
        <Card as='article' className={`${css.weightTile} ${revealCss.reveal}`} variant='primary'>
          <div className={css.tileTop}>
            <span>Weight signal</span>
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
              <strong>No weight signal yet</strong>
              <p>One entry is enough to light up this tile.</p>
            </div>
          )}
          <TileLink label='Go to Weight' to='/weight' />
        </Card>

        <Card
          as='section'
          className={`${css.recipeTile} ${revealCss.reveal} ${revealCss.delay1}`}
          shadow={false}
        >
          <div className={css.tileTop}>
            <span>Recently saved</span>
            <UtensilsIcon aria-hidden='true' />
          </div>
          <h2>Recipe stack</h2>
          <div className={css.recipeStack}>
            {data.recentRecipes.length ? (
              data.recentRecipes.map((recipe, index) => (
                <Link
                  className={css.recipe}
                  key={recipe.id}
                  params={{ id: recipe.id }}
                  to='/recipes/view/$id'
                >
                  <span className={css.recipeNumber}>0{index + 1}</span>
                  <div>
                    <strong>{recipe.name}</strong>
                    <small>
                      {recipe.kcal === null ? 'Nutrition not set' : `${recipe.kcal} kcal`}
                      {recipe.rating ? (
                        <>
                          {' '}
                          · <StarIcon aria-hidden='true' /> {recipe.rating}
                        </>
                      ) : null}
                    </small>
                  </div>
                  <ArrowRightIcon aria-hidden='true' />
                </Link>
              ))
            ) : (
              <div className={css.emptyRecipes}>
                <p>No saved recipes yet.</p>
                <Btn isLink render={<Link to='/recipes/add' />} variant='outlineMain'>
                  Add the first
                </Btn>
              </div>
            )}
          </div>
          <TileLink label='Go to Recipes' to='/recipes' />
        </Card>

        <Card
          as='article'
          className={`${css.todosTile} ${revealCss.reveal} ${revealCss.delay2}`}
          shadow={false}
        >
          <div className={css.tileTop}>
            <span>Preview</span>
            <CheckIcon aria-hidden='true' />
          </div>
          <h2>Todos</h2>
          <ul className={css.todoList}>
            {todoPreview.map((todo) => (
              <li key={todo.label} className={todo.done ? css.todoDone : undefined}>
                <span aria-hidden='true'>{todo.done ? '✓' : ''}</span>
                {todo.label}
              </li>
            ))}
          </ul>
          <TileLink label='Go to Todos' to='/todos' />
        </Card>

        <Card
          as='article'
          className={`${css.diaryTile} ${revealCss.reveal} ${revealCss.delay3}`}
          shadow={false}
        >
          <div className={css.tileTop}>
            <span>Private notes</span>
            <BookOpenIcon aria-hidden='true' />
          </div>
          <div className={css.diaryReadout}>{formatDiaryDistance(data.lastDiaryEntryDate)}</div>
          <div className={css.diaryLines} aria-hidden='true'>
            <i />
            <i />
            <i />
          </div>
          <TileLink label='Go to Diary' to='/diary' />
        </Card>

        <Card
          as='article'
          className={`${css.familyTile} ${revealCss.reveal} ${revealCss.delay4}`}
          shadow={false}
        >
          <div className={css.statusIcon}>
            <UsersRoundIcon aria-hidden='true' />
          </div>
          <div>
            <span className={css.status}>Planned</span>
            <h2>Family and friends</h2>
            <p>A shared corner for the people you choose. Nothing leaves your orbit by default.</p>
          </div>
          <div className={css.orbitPeople} aria-hidden='true'>
            <i />
            <i />
            <i />
            <i />
          </div>
        </Card>

        <Card
          as='article'
          className={`${css.foodTile} ${revealCss.reveal} ${revealCss.delay5}`}
          shadow={false}
        >
          <div className={css.statusIcon}>
            <FlameIcon aria-hidden='true' />
          </div>
          <div>
            <span className={css.status}>In progress</span>
            <h2>Food logging</h2>
            <p>Daily calories and macros will take this space when the tracker is ready.</p>
          </div>
          <div className={css.macroPreview} aria-hidden='true'>
            <span>kcal</span>
            <span>protein</span>
            <span>fat</span>
            <span>carbs</span>
          </div>
        </Card>

        <Card
          as='article'
          className={`${css.workoutTile} ${revealCss.reveal} ${revealCss.delay6}`}
          shadow={false}
        >
          <div className={css.statusIcon}>
            <DumbbellIcon aria-hidden='true' />
          </div>
          <div>
            <span className={css.status}>Planned</span>
            <h2>Workout log</h2>
            <p>Last sessions and training notes will slot into this rhythm later.</p>
          </div>
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

function TileLink({
  label,
  to,
}: {
  label: string;
  to: '/diary' | '/recipes' | '/todos' | '/weight';
}) {
  return (
    <Link className={css.tileLink} to={to}>
      {label}
      <ArrowRightIcon aria-hidden='true' />
    </Link>
  );
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
