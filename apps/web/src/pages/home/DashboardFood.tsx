import type { HomeDashboardData } from './home.api';
import css from './HomeDashboard.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { MACRO_LABELS } from '@/lib/nutritionLabels';

export function DashboardFood({ nutrition }: { nutrition: HomeDashboardData['nutrition'] }) {
  const { formatWhole, t } = useI18n();
  const kcal = nutrition.totals.kcal;

  return (
    <div className={css.nutrition}>
      <div className={css.kcal}>
        <div className={css.kcalValue}>
          <strong>{formatWhole(kcal)}</strong>
          <span>kcal</span>
          <small>
            {nutrition.goal
              ? t({
                  en: `of ${formatWhole(nutrition.goal.kcal)}`,
                  pl: `z ${formatWhole(nutrition.goal.kcal)}`,
                })
              : t({ en: 'No goal', pl: 'Brak celu' })}
          </small>
        </div>
        <NutritionProgress goal={nutrition.goal?.kcal ?? null} label='kcal' total={kcal} />
      </div>
      <div className={css.macros}>
        <MacroProgress
          label='protein'
          total={nutrition.totals.protein}
          goal={nutrition.goal?.protein ?? null}
        />
        <MacroProgress
          label='fat'
          total={nutrition.totals.fat}
          goal={nutrition.goal?.fat ?? null}
        />
        <MacroProgress
          label='carbs'
          total={nutrition.totals.carbs}
          goal={nutrition.goal?.carbs ?? null}
        />
      </div>
    </div>
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
  const { formatWhole, t } = useI18n();

  return (
    <div className={css.macroProgress}>
      <div className={css.macroHeading}>
        <span>{t(MACRO_LABELS[label])}</span>
        <strong>{formatWhole(total)}g</strong>
        <small>
          {goal === null
            ? t({ en: 'No goal', pl: 'Brak celu' })
            : t({
                en: `of ${formatWhole(goal)}g`,
                pl: `z ${formatWhole(goal)}g`,
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
  const { formatWhole, t } = useI18n();
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
                en: `${formatWhole(total)} of ${formatWhole(goal)}${unit}`,
                pl: `${formatWhole(total)} z ${formatWhole(goal)}${unit}`,
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
