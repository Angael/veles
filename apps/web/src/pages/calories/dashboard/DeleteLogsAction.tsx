import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import type { CalorieLog } from '../calories.api';
import { useDeleteFoodLogsMutation } from '../calories.query';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog/Dialog';
import { SelectionBarAction } from '@/components/ui/selection-bar/SelectionBar';

type Props = {
  logs: CalorieLog[];
  onDeleted: () => void;
};

/** Selection bar Delete action; confirms in a dialog, then deletes every selected log in one request. */
export function DeleteLogsAction({ logs, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteFoodLogsMutation();
  const products = `${logs.length} ${logs.length === 1 ? 'product' : 'products'}`;
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
    <DialogRoot onOpenChange={setOpen} open={open}>
      <SelectionBarAction
        icon={<Trash2Icon aria-hidden='true' />}
        label='Delete'
        render={<DialogTrigger />}
        variant='ghostDanger'
      />
      <DialogPopup>
        <DialogTitle>Delete {products}?</DialogTitle>
        <DialogDescription>
          They are removed from this day, taking {kcal} kcal off your total. This can't be undone.
        </DialogDescription>
        <DialogActions>
          <DialogClose render={<Btn variant='ghost' />}>Cancel</DialogClose>
          <Btn
            icon={<Trash2Icon aria-hidden='true' />}
            loading={deleteMutation.isPending}
            onClick={confirm}
            variant='danger'
          >
            Delete
          </Btn>
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}
