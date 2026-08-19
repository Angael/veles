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
          <div className={css.identity}>
            <strong>{entry.name}</strong>
            <span>
              {entry.grams === null ? 'Custom entry' : `${formatNutritionNumber(entry.grams)} g`}
            </span>
          </div>

          <dl className={css.nutrition}>
            <div>
              <dt>Kcal</dt>
              <dd className={css.energy}>{formatNutritionNumber(Math.round(entry.kcal))}</dd>
            </div>
            <div>
              <dt>Protein</dt>
              <dd className={css.protein}>
                {formatNutritionNumber(Math.round(entry.protein ?? 0))} g
              </dd>
            </div>
            <div>
              <dt>Fat</dt>
              <dd className={css.fat}>{formatNutritionNumber(Math.round(entry.fat ?? 0))} g</dd>
            </div>
            <div>
              <dt>Carbs</dt>
              <dd className={css.carbs}>{formatNutritionNumber(Math.round(entry.carbs ?? 0))} g</dd>
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
