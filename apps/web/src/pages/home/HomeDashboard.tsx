import { Link } from '@tanstack/react-router';
import { differenceInCalendarDays, parseISO } from 'date-fns';
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
import type { HomeDashboardData } from './home.api';
import css from './HomeDashboard.module.css';
import { type I18n, useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';
import { MACRO_LABELS } from '@/lib/nutritionLabels';

type HomeDashboardProps = {
  data: HomeDashboardData;
};

export function HomeDashboard({ data }: HomeDashboardProps) {
  const i18n = useI18n();
  const { formatDate, formatNumber, t } = i18n;
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
        <Card as='article' className={css.foodTile} data-appear shadow={false}>
          <div className={css.tileHeading}>
            <h2>{t({ en: 'Today’s food', pl: 'Dzisiejsze jedzenie' })}</h2>
            <FlameIcon aria-hidden='true' />
          </div>
          <div className={css.nutrition}>
            <div className={css.kcal}>
              <div className={css.kcalValue}>
                <strong>{formatNumber(Math.round(kcal))}</strong>
                <span>kcal</span>
                <small>
                  {data.nutrition.goal
                    ? t({
                        en: `of ${formatNumber(Math.round(data.nutrition.goal.kcal))}`,
                        pl: `z ${formatNumber(Math.round(data.nutrition.goal.kcal))}`,
                      })
                    : t({ en: 'No goal', pl: 'Brak celu' })}
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
          <Link
            aria-label={t({ en: 'Open Today’s food', pl: 'Otwórz dzisiejsze jedzenie' })}
            className={css.cardLink}
            to='/calories'
          />
        </Card>

        <Card as='article' className={css.weightTile} data-appear='1' shadow={false}>
          <div className={css.tileHeading}>
            <h2>{t({ en: 'Weight', pl: 'Waga' })}</h2>
            <ScaleIcon aria-hidden='true' />
          </div>
          {latestWeight ? (
            <>
              <div className={css.weightValue}>
                <strong>
                  {formatNumber(latestWeight.weightKg, {
                    maximumFractionDigits: 1,
                    minimumFractionDigits: 1,
                  })}
                </strong>
                <span>kg</span>
              </div>
              <div className={css.chart}>
                {chartPoints ? (
                  <svg
                    aria-label={t({ en: 'Recent weight trend', pl: 'Ostatni trend wagi' })}
                    role='img'
                    viewBox='0 0 300 96'
                  >
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
                <span>{formatDate(latestWeight.date, { day: 'numeric', month: 'short' })}</span>
                <span>{formatDelta(delta, i18n)}</span>
              </div>
            </>
          ) : (
            <div className={css.emptyWeight}>
              <strong>{t({ en: 'No weight logged yet', pl: 'Brak zapisanej wagi' })}</strong>
              <p>
                {t({
                  en: 'Log your first weight to see your trend.',
                  pl: 'Zapisz pierwszy pomiar, aby zobaczyć trend.',
                })}
              </p>
            </div>
          )}
          <Link
            aria-label={t({ en: 'Open Weight', pl: 'Otwórz wagę' })}
            className={css.cardLink}
            to='/weight'
          />
        </Card>

        <Card as='section' className={css.recipeTile} data-appear='2' shadow={false}>
          <div className={css.tileHeading}>
            <h2>{t({ en: 'Recipes for today', pl: 'Przepisy na dziś' })}</h2>
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
          <Link
            aria-label={t({ en: 'Browse recipes', pl: 'Przeglądaj przepisy' })}
            className={css.cardLink}
            to='/recipes'
          />
        </Card>

        <Card as='article' className={css.todosTile} data-appear='3' shadow={false}>
          <div className={css.tileHeading}>
            <h2>{t({ en: 'Notes', pl: 'Notatki' })}</h2>
            <CheckIcon aria-hidden='true' />
          </div>
          <p>{t({ en: 'View your list', pl: 'Zobacz swoją listę' })}</p>
          <Link
            aria-label={t({ en: 'Open Notes', pl: 'Otwórz notatki' })}
            className={css.cardLink}
            to='/todos'
          />
        </Card>

        <Card as='article' className={css.diaryTile} data-appear='4' shadow={false}>
          <div className={css.tileHeading}>
            <h2>{t({ en: 'Diary', pl: 'Dziennik' })}</h2>
            <BookOpenIcon aria-hidden='true' />
          </div>
          <div className={css.diaryReadout}>
            {formatDiaryDistance(data.lastDiaryEntryDate, i18n)}
          </div>
          <Link
            aria-label={t({ en: 'Open Diary', pl: 'Otwórz dziennik' })}
            className={css.cardLink}
            to='/diary'
          />
        </Card>

        <Card as='article' className={css.familyTile} data-appear='5' shadow={false}>
          <div className={css.tileHeading}>
            <h2>{t({ en: 'Family and friends', pl: 'Rodzina i znajomi' })}</h2>
            <UsersRoundIcon aria-hidden='true' />
          </div>
          <p>
            {t({
              en: 'Manage your connections in Account',
              pl: 'Zarządzaj połączeniami w ustawieniach konta',
            })}
          </p>
          <Link
            aria-label={t({
              en: 'Open Family and friends in Account',
              pl: 'Otwórz rodzinę i znajomych w koncie',
            })}
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
  const { formatNumber, t } = useI18n();

  return (
    <div className={css.macroProgress}>
      <div className={css.macroHeading}>
        <span>{t(MACRO_LABELS[label])}</span>
        <strong>{formatNumber(Math.round(total))}g</strong>
        <small>
          {goal === null
            ? t({ en: 'No goal', pl: 'Brak celu' })
            : t({
                en: `of ${formatNumber(Math.round(goal))}g`,
                pl: `z ${formatNumber(Math.round(goal))}g`,
              })}
        </small>
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
  const { formatNumber, t } = useI18n();
  const maximum = goal === null ? Math.max(total, 1) : Math.max(goal, 1);
  const name = label === 'kcal' ? 'kcal' : t(MACRO_LABELS[label]);
  const unit = label === 'kcal' ? ' kcal' : 'g';

  return (
    <div className={css.progressTrack}>
      <progress
        aria-label={t({ en: `${name} progress`, pl: `Postęp: ${name}` })}
        aria-valuetext={
          goal !== null && total > goal
            ? t({
                en: `${formatNumber(Math.round(total))} of ${formatNumber(Math.round(goal))}${unit}`,
                pl: `${formatNumber(Math.round(total))} z ${formatNumber(Math.round(goal))}${unit}`,
              })
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

function formatDelta(delta: number | null, { formatNumber, t }: I18n) {
  if (delta === null) return t({ en: 'First point', pl: 'Pierwszy pomiar' });
  if (Math.abs(delta) < 0.05) return t({ en: 'Steady', pl: 'Bez zmian' });
  return `${formatNumber(delta, { maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay: 'always' })} kg`;
}

/** Turns the latest diary date into a private, content-free activity signal. */
function formatDiaryDistance(entryDate: string | null, { t }: I18n) {
  if (!entryDate) return t({ en: 'No notes yet', pl: 'Brak notatek' });
  const days = differenceInCalendarDays(new Date(), parseISO(entryDate));
  if (days <= 0) return t({ en: 'Today', pl: 'Dzisiaj' });
  return t({
    en: `${days} ${pluralEn(days, 'day', 'days')} since last note`,
    pl: `${days} ${pluralPl(days, 'dzień', 'dni', 'dni')} od ostatniej notatki`,
  });
}
