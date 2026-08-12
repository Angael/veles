import { Link } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import {
  ArrowRightIcon,
  DumbbellIcon,
  FlameIcon,
  PlusIcon,
  ScaleIcon,
  ShieldCheckIcon,
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
  const latestWeight = data.weightEntries.at(-1);
  const previousWeight = data.weightEntries.at(-2);
  const delta =
    latestWeight && previousWeight ? latestWeight.weightKg - previousWeight.weightKg : null;
  const chartPoints = getChartPoints(data.weightEntries);

  return (
    <main className={css.layout}>
      <header className={css.header}>
        <div className={css.identity}>
          <span className={css.signal} aria-hidden='true' />
          <div>
            <span>Private workspace / active</span>
            <h1>{user.name}&apos;s control surface</h1>
          </div>
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
            Recipes
          </Btn>
        </div>
      </header>

      <Card as='section' className={css.console} shadow={false}>
        <div className={css.consoleBar}>
          <span>Module WGT / recent series</span>
          <span>{data.weightEntries.length.toString().padStart(2, '0')} points loaded</span>
        </div>

        <div className={css.weightReadout}>
          <div className={css.readingLabel}>
            <ScaleIcon aria-hidden='true' />
            <span>Latest measurement</span>
          </div>
          {latestWeight ? (
            <>
              <div className={css.readingValue}>
                <strong>{latestWeight.weightKg.toFixed(1)}</strong>
                <span>kg</span>
              </div>
              <dl className={css.weightStats}>
                <div>
                  <dt>recorded</dt>
                  <dd>{format(parseISO(latestWeight.date), 'MMM d, yyyy')}</dd>
                </div>
                <div>
                  <dt>previous</dt>
                  <dd>{previousWeight ? `${previousWeight.weightKg.toFixed(1)} kg` : '—'}</dd>
                </div>
                <div>
                  <dt>change</dt>
                  <dd>{formatDelta(delta)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <div className={css.emptyReading}>
              <strong>No measurement available</strong>
              <span>Waiting for first weight entry.</span>
            </div>
          )}
        </div>

        <div className={css.chartPanel}>
          <div className={css.chartHeader}>
            <span>Trend plot</span>
            <span>oldest → latest</span>
          </div>
          {chartPoints ? (
            <svg aria-label='Recent weight trend' role='img' viewBox='0 0 360 120'>
              <line x1='0' x2='360' y1='20' y2='20' />
              <line x1='0' x2='360' y1='60' y2='60' />
              <line x1='0' x2='360' y1='100' y2='100' />
              <polyline points={chartPoints} />
            </svg>
          ) : (
            <div className={css.noChart}>SERIES NEEDS 02+ POINTS</div>
          )}
          <Link className={css.consoleLink} to='/weight'>
            Open full history <ArrowRightIcon aria-hidden='true' />
          </Link>
        </div>
      </Card>

      <section className={css.lowerGrid}>
        <Card as='section' className={css.recipes} shadow={false}>
          <header className={css.panelHeader}>
            <div>
              <span>Module RCP / last updated</span>
              <h2>Recipe queue</h2>
            </div>
            <UtensilsIcon aria-hidden='true' />
          </header>

          <div className={css.recipeTable}>
            <div className={css.tableHead} aria-hidden='true'>
              <span>ID</span>
              <span>Recipe</span>
              <span>Updated</span>
              <span>Readout</span>
              <span />
            </div>
            {data.recentRecipes.length ? (
              data.recentRecipes.map((recipe, index) => (
                <Link
                  className={css.recipeRow}
                  key={recipe.id}
                  params={{ id: recipe.id }}
                  to='/recipes/view/$id'
                >
                  <span className={css.code}>R{String(index + 1).padStart(2, '0')}</span>
                  <strong>{recipe.name}</strong>
                  <span>{format(parseISO(recipe.updatedAt), 'MMM d')}</span>
                  <span className={css.recipeMetric}>
                    {recipe.kcal === null ? 'kcal —' : `${recipe.kcal} kcal`}
                    {recipe.rating ? (
                      <>
                        {' '}
                        / <StarIcon aria-hidden='true' /> {recipe.rating}
                      </>
                    ) : null}
                  </span>
                  <ArrowRightIcon aria-hidden='true' />
                </Link>
              ))
            ) : (
              <div className={css.emptyRecipes}>
                <span>NO RECIPE RECORDS</span>
                <Btn isLink render={<Link to='/recipes/add' />} variant='outlineMain'>
                  Add recipe
                </Btn>
              </div>
            )}
          </div>

          <Link className={css.panelLink} to='/recipes'>
            View recipe library <ArrowRightIcon aria-hidden='true' />
          </Link>
        </Card>

        <Card as='aside' className={css.systems} shadow={false}>
          <header className={css.panelHeader}>
            <div>
              <span>System deployment</span>
              <h2>Incoming modules</h2>
            </div>
            <ShieldCheckIcon aria-hidden='true' />
          </header>
          <div className={css.systemRow}>
            <FlameIcon aria-hidden='true' />
            <div>
              <strong>Food logging</strong>
              <span>BUILDING</span>
            </div>
            <p>Daily calorie and macro readouts.</p>
          </div>
          <div className={css.systemRow}>
            <DumbbellIcon aria-hidden='true' />
            <div>
              <strong>Workouts</strong>
              <span>PLANNED</span>
            </div>
            <p>Recent sessions, exercises, and notes.</p>
          </div>
        </Card>
      </section>
    </main>
  );
}

/** Maps actual recent measurements into the fixed command-console plot. */
function getChartPoints(entries: HomeDashboardData['weightEntries']) {
  if (entries.length < 2) return '';
  const weights = entries.map((entry) => entry.weightKg);
  const min = Math.min(...weights);
  const spread = Math.max(Math.max(...weights) - min, 0.1);
  return weights
    .map(
      (weight, index) =>
        `${(index / (weights.length - 1)) * 360},${108 - ((weight - min) / spread) * 96}`,
    )
    .join(' ');
}

function formatDelta(delta: number | null) {
  if (delta === null) return '—';
  if (Math.abs(delta) < 0.05) return '0.0 kg';
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`;
}
