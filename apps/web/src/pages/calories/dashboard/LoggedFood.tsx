import { Link } from '@tanstack/react-router';
import { Trash2Icon } from 'lucide-react';
import type { CalorieLog } from '../calories.api';
import { useDeleteFoodLogMutation } from '../calories.query';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { NutritionInline } from '@/components/nutrition-inline/NutritionInline';
import { formatNutritionNumber } from '@/lib/nutritionFormat';
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

          <NutritionInline
            carbs={entry.carbs ?? 0}
            energyDisplay='phone'
            fat={entry.fat ?? 0}
            kcal={entry.kcal}
            protein={entry.protein ?? 0}
          />
        </div>
      </Card>
    </li>
  );
}
