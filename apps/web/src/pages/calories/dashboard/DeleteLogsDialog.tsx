import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import type { CalorieLog } from '../calories.api';
import { useDeleteFoodLogsMutation } from '../calories.query';
import { Btn } from '@/components/ui/btn/Btn';
import { Dialog, DialogTrigger } from '@/components/ui/dialog/Dialog';
import { productCount } from './selectionText';
import css from './SelectionBar.module.css';

type Props = {
  logs: CalorieLog[];
  onDeleted: () => void;
};

/** Confirms and deletes every selected log in one request. */
export function DeleteLogsDialog({ logs, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteFoodLogsMutation();
  const products = productCount(logs.length);
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
      title={`Delete ${products}?`}
      trigger={
        <Btn
          aria-label='Delete'
          className={css.collapsible}
          icon={<Trash2Icon aria-hidden='true' />}
          radius='pill'
          render={<DialogTrigger />}
          variant='ghostDanger'
        >
          <span className={css.label}>Delete</span>
        </Btn>
      }
    />
  );
}
