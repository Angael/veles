import { Link } from '@tanstack/react-router';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { formatDaysAgo } from '@/lib/relativeDay';
import { DayEstimateText } from '@/pages/meal-plan/DayEstimateText';
import { estimateDay, mealName } from '@/pages/meal-plan/mealPlanEstimate';
import type { HomeDashboardData } from './home.api';
import css from './HomeDashboard.module.css';

const VISIBLE_MEALS = 3;

/** Today and the next two days of the meal plan; each day opens the planner on that date. */
export function DashboardMealPlan({ days }: { days: HomeDashboardData['mealPlan'] }) {
  const i18n = useI18n();
  const { formatDate, t } = i18n;

  return (
    <div className={css.planDays}>
      {days.map(({ date, items }, index) => {
        const hidden = items.length - VISIBLE_MEALS;

        return (
          <Link className={css.planDay} key={date} search={{ date }} to='/meal-plan'>
            <span className={css.planDayLabel}>
              {index < 2
                ? formatDaysAgo(date, i18n)
                : formatDate(date, { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
            {items.length ? (
              <>
                <ul>
                  {items.slice(0, VISIBLE_MEALS).map((item) => (
                    <li key={item.id}>{mealName(item)}</li>
                  ))}
                  {hidden > 0 ? (
                    <li className={css.planMore}>
                      {t({ en: `+${hidden} more`, pl: `+${hidden} więcej` })}
                    </li>
                  ) : null}
                </ul>
                <DayEstimateText estimate={estimateDay(items)} />
              </>
            ) : (
              <span className={css.planEmpty}>
                {t({ en: 'Nothing planned yet', pl: 'Nic jeszcze nie zaplanowano' })}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
