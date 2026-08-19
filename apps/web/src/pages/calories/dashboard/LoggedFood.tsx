import { Link } from '@tanstack/react-router';
import { Trash2Icon } from 'lucide-react';
import type { CalorieLog } from '../calories.api';
import { useDeleteFoodLogMutation } from '../calorieQueries';
import { formatNutritionNumber } from './nutritionFormat';
import { Btn } from '@/components/btn/Btn';
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
      <Link className={css.body} params={{ logId: entry.id }} to='/calories/logs/$logId'>
        <div className={css.identity}>
          <strong>{entry.name}</strong>
          <span>
            {entry.grams === null ? 'Custom entry' : `${formatNutritionNumber(entry.grams)} g`}
          </span>
        </div>

        <dl className={css.nutrition}>
          <div className={css.energy}>
            <dt>Energy</dt>
            <dd>
              {formatNutritionNumber(entry.kcal)}
              <span> kcal</span>
            </dd>
          </div>
          <div className={css.protein}>
            <dt>Protein</dt>
            <dd>
              {formatNutritionNumber(entry.protein ?? 0)}
              <span> g</span>
            </dd>
          </div>
          <div className={css.fat}>
            <dt>Fat</dt>
            <dd>
              {formatNutritionNumber(entry.fat ?? 0)}
              <span> g</span>
            </dd>
          </div>
          <div className={css.carbs}>
            <dt>Carbs</dt>
            <dd>
              {formatNutritionNumber(entry.carbs ?? 0)}
              <span> g</span>
            </dd>
          </div>
        </dl>
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
