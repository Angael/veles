import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import type { CalorieLog } from '../calories.api';
import { useDeleteFoodLogsMutation } from '../calories.query';
import { Dialog, DialogTrigger } from '@/components/ui/dialog/Dialog';
import { SelectionBarAction } from '@/components/ui/selection-bar/SelectionBar';

type Props = {
  logs: CalorieLog[];
  onDeleted: () => void;
};

/** Confirms and deletes every selected log in one request. */
export function DeleteLogsDialog({ logs, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteFoodLogsMutation();
  const kcal = Math.round(logs.reduce((sum, entry) => sum + entry.kcal, 0));

  function confirm() {
    deleteMutation.mutate(
      logs.map((entry) => entry.id),
      {
        onSuccess: () => {
          setOpen(false);
          onDeleted();
        },
      },
    );
  }

  return (
    <Dialog
      body={
        <p>
          They are removed from this day, taking {kcal} kcal off your total. This can't be undone.
        </p>
      }
      okButtonProps={{
        icon: <Trash2Icon aria-hidden='true' />,
        loading: deleteMutation.isPending,
        onClick: confirm,
        variant: 'danger',
      }}
      okLabel='Delete'
      onOpenChange={setOpen}
      open={open}
      title={`Delete ${logs.length} ${logs.length === 1 ? 'product' : 'products'}?`}
      trigger={
        <SelectionBarAction
          icon={<Trash2Icon aria-hidden='true' />}
          label='Delete'
          render={<DialogTrigger />}
          variant='ghostDanger'
        />
      }
    />
  );
}
