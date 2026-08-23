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
  const kcal = formatNutritionNumber(Math.round(entry.kcal));

  function remove() {
    deleteMutation.mutate({ date, id: entry.id });
  }

  return (
    <li className={css.item}>
      <Card as='article' className={css.card}>
        <div aria-hidden='true' className={css.energyTile}>
          <strong>{kcal}</strong>
          <span>kcal</span>
        </div>

        <div className={css.body}>
          <div className={css.top}>
            {/* Stretched over the whole card via .cardLink::after. */}
            <Link className={css.cardLink} params={{ logId: entry.id }} to='/calories/logs/$logId'>
              <strong className={css.name}>{entry.name}</strong>
            </Link>
            <span className={css.grams}>
              {entry.grams === null ? 'Custom entry' : `${formatNutritionNumber(entry.grams)} g`}
            </span>
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
          </div>

          <div className={css.bottom}>
            <div aria-hidden='true' className={css.energyInline}>
              <strong>{kcal}</strong>
              <span>kcal</span>
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
          </div>
        </div>
      </Card>
    </li>
  );
}
