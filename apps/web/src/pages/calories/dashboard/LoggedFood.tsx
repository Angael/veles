import { Link } from '@tanstack/react-router';
import { Trash2Icon } from 'lucide-react';
import type { CalorieLog } from '../calories.api';
import { useDeleteFoodLogMutation } from '../calorieQueries';
import { formatNutritionNumber } from './nutritionFormat';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import css from './LoggedFood.module.css';

type LoggedFoodProps = {
  date: string;
  entry: CalorieLog;
};

export function LoggedFood({ date, entry }: LoggedFoodProps) {
  const deleteMutation = useDeleteFoodLogMutation();

  function remove() {
    deleteMutation.mutate({ date, id: entry.id });
  }

  return (
    <li className={css.item}>
      <Link className={css.cardLink} params={{ logId: entry.id }} to='/calories/logs/$logId'>
        <Card as='article' className={css.card}>
          <div aria-hidden='true' className={css.energyTile}>
            <strong>{formatNutritionNumber(Math.round(entry.kcal))}</strong>
            <span>kcal</span>
          </div>

          <div className={css.identity}>
            <strong>{entry.name}</strong>
            <span>
              {entry.grams === null ? 'Custom entry' : `${formatNutritionNumber(entry.grams)} g`}
            </span>
          </div>

          <dl className={css.macros}>
            <div className={css.macro}>
              <dt>Protein</dt>
              <dd>
                <i aria-hidden='true' className={css.dotProtein} />
                {formatNutritionNumber(Math.round(entry.protein ?? 0))} g
              </dd>
            </div>
            <div className={css.macro}>
              <dt>Fat</dt>
              <dd>
                <i aria-hidden='true' className={css.dotFat} />
                {formatNutritionNumber(Math.round(entry.fat ?? 0))} g
              </dd>
            </div>
            <div className={css.macro}>
              <dt>Carbs</dt>
              <dd>
                <i aria-hidden='true' className={css.dotCarbs} />
                {formatNutritionNumber(Math.round(entry.carbs ?? 0))} g
              </dd>
            </div>
          </dl>
        </Card>
      </Link>

      <Btn
        aria-label={`Delete ${entry.name}`}
        className={css.deleteButton}
        icon={<Trash2Icon aria-hidden='true' />}
        iconOnly
        loading={deleteMutation.isPending}
        onClick={remove}
        size='sm'
        variant='ghostDanger'
      />
    </li>
  );
}
