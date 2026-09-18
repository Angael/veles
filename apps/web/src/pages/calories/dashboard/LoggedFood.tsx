import { Link } from '@tanstack/react-router';
import { Trash2Icon } from 'lucide-react';
import { FoodSummary } from '../FoodSummary';
import type { CalorieLog } from '../calories.api';
import { useDeleteFoodLogMutation } from '../calories.query';
import { Btn } from '@/components/ui/btn/Btn';
import { ListItem } from '@/components/ui/list/List';

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
    <ListItem interactive style={{ padding: 0 }}>
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
