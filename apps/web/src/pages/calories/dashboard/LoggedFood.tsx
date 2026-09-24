import { Link } from '@tanstack/react-router';
import { Trash2Icon } from 'lucide-react';
import { FoodSummary } from '../FoodSummary';
import type { CalorieLog } from '../calories.api';
import { useDeleteFoodLogMutation } from '../calories.query';
import { Btn } from '@/components/ui/btn/Btn';
import { ListItem } from '@/components/ui/list/List';
import css from './LogSelection.module.css';

type LoggedFoodProps = {
  date: string;
  entry: Pick<
    CalorieLog,
    'id' | 'name' | 'grams' | 'kcal' | 'protein' | 'fat' | 'carbs' | 'imageUrl'
  >;
  sample?: boolean;
  selecting: boolean;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
};

export function LoggedFood({
  date,
  entry,
  sample = false,
  selecting,
  selected,
  onSelect,
}: LoggedFoodProps) {
  const deleteMutation = useDeleteFoodLogMutation();

  function remove() {
    deleteMutation.mutate({ date, id: entry.id });
  }

  let action = null;
  if (selecting) {
    action = (
      <label className={css.selectionTarget}>
        <input
          aria-label={`Select ${entry.name}`}
          checked={selected}
          onChange={(event) => onSelect(entry.id, event.target.checked)}
          type='checkbox'
        />
      </label>
    );
  } else if (!sample) {
    action = (
      <Btn
        aria-label={`Delete ${entry.name}`}
        icon={<Trash2Icon aria-hidden='true' />}
        iconOnly
        loading={deleteMutation.isPending}
        onClick={remove}
        size='sm'
        variant='ghostDanger'
      />
    );
  }

  return (
    <ListItem interactive={selecting} selected={selected} style={{ padding: 0 }}>
      <FoodSummary
        action={action}
        carbs={entry.carbs ?? 0}
        density='compact'
        fat={entry.fat ?? 0}
        imageUrl={entry.imageUrl}
        kcal={entry.kcal}
        meta={entry.grams === null ? 'Custom entry' : `${Math.round(entry.grams)} g`}
        name={
          selecting || sample ? (
            entry.name
          ) : (
            <Link params={{ logId: entry.id }} to='/calories/logs/$logId'>
              {entry.name}
            </Link>
          )
        }
        protein={entry.protein ?? 0}
      />
    </ListItem>
  );
}
