import { Link } from '@tanstack/react-router';
import { Trash2Icon } from 'lucide-react';
import { FoodSummary } from '../FoodSummary';
import type { CalorieLog } from '../calories.api';
import { useDeleteFoodLogMutation } from '../calories.query';
import { Btn } from '@/components/ui/btn/Btn';
import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import { ListItem } from '@/components/ui/list/List';
import css from './LoggedFood.module.css';

type LoggedFoodProps = {
  date: string;
  entry: CalorieLog;
  onSelectedChange: (id: string, selected: boolean) => void;
  selected: boolean;
};

export function LoggedFood({ date, entry, onSelectedChange, selected }: LoggedFoodProps) {
  const deleteMutation = useDeleteFoodLogMutation();

  function remove() {
    deleteMutation.mutate({ date, id: entry.id });
  }

  return (
    <ListItem className={css.item} selected={selected} style={{ padding: 0 }}>
      <FoodSummary
        action={
          <Btn
            aria-label={`Delete ${entry.name}`}
            icon={<Trash2Icon aria-hidden='true' />}
            iconOnly
            loading={deleteMutation.isPending}
            onClick={remove}
            size='sm'
            variant='ghostDanger'
          />
        }
        carbs={entry.carbs ?? 0}
        density='compact'
        fat={entry.fat ?? 0}
        imageUrl={entry.imageUrl}
        kcal={entry.kcal}
        mediaOverlay={
          <label className={css.selectTarget}>
            <Checkbox
              aria-label={`Select ${entry.name}`}
              checked={selected}
              className={css.checkbox}
              onCheckedChange={(checked) => onSelectedChange(entry.id, checked)}
            />
          </label>
        }
        meta={entry.grams === null ? 'Custom entry' : `${Math.round(entry.grams)} g`}
        name={
          <Link params={{ logId: entry.id }} to='/calories/logs/$logId'>
            {entry.name}
          </Link>
        }
        protein={entry.protein ?? 0}
      />
    </ListItem>
  );
}
