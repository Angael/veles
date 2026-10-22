import clsx from 'clsx';
import { PlusIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { List } from '@/components/ui/list/List';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { daysAgo, formatDaysAgo } from '@/lib/relativeDay';
import { DayEstimateText } from './DayEstimateText';
import { estimateDay, type MealPlanItem } from './mealPlanEstimate';
import { PlannedMealRow } from './PlannedMealRow';
import css from './MealPlanPage.module.css';

type Props = {
  anchorId: string;
  date: string;
  items: MealPlanItem[];
  onAdd: () => void;
  onEdit: (item: MealPlanItem) => void;
  order: number;
  today: string;
};

/** One day of the plan: its meals, an estimated total, and an add button that works when empty. */
export function MealPlanDay({ anchorId, date, items, onAdd, onEdit, order, today }: Props) {
  const i18n = useI18n();
  const { formatDate, t } = i18n;
  const isToday = date === today;
  const isPast = date < today;
  const relative = Math.abs(daysAgo(date)) <= 1 ? formatDaysAgo(date, i18n) : null;

  return (
    <Card
      aria-labelledby={`${anchorId}-title`}
      as='section'
      className={clsx(css.day, isToday && css.today, isPast && css.past)}
      data-appear={String(Math.min(order + 1, 6))}
      id={anchorId}
      shadow={false}
    >
      <header className={css.dayHeader}>
        <h3 id={`${anchorId}-title`}>
          {formatDate(date, { weekday: 'long', day: 'numeric', month: 'short' })}
          {relative ? <span className={css.relative}>{relative}</span> : null}
        </h3>
        {items.length ? <DayEstimateText estimate={estimateDay(items)} /> : null}
      </header>

      {items.length ? (
        <List className={css.meals}>
          {items.map((item) => (
            <PlannedMealRow item={item} key={item.id} onEdit={() => onEdit(item)} today={today} />
          ))}
        </List>
      ) : (
        <p className={css.empty}>{t({ en: 'Nothing planned.', pl: 'Nic nie zaplanowano.' })}</p>
      )}

      <Btn
        className={css.addMeal}
        icon={<PlusIcon aria-hidden='true' />}
        onClick={onAdd}
        size='sm'
        variant='ghost'
      >
        {t({ en: 'Add meal', pl: 'Dodaj posiłek' })}
      </Btn>
    </Card>
  );
}
