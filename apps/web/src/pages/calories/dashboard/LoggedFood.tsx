import { Link } from '@tanstack/react-router';
import { Trash2Icon } from 'lucide-react';
import { CalorieFoodCard } from '../CalorieFoodCard';
import type { CalorieLog } from '../calories.api';
import { useDeleteFoodLogMutation } from '../calories.query';
import { Btn } from '@/components/ui/btn/Btn';

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
    <CalorieFoodCard
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
      gramsLabel={entry.grams === null ? 'Custom entry' : `${Math.round(entry.grams)} g`}
      imageUrl={entry.imageUrl}
      kcal={entry.kcal}
      protein={entry.protein ?? 0}
      fat={entry.fat ?? 0}
      carbs={entry.carbs ?? 0}
    >
      <Link params={{ logId: entry.id }} to='/calories/logs/$logId'>
        {entry.name}
      </Link>
    </CalorieFoodCard>
  );
}
