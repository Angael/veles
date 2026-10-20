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
import { useI18n } from '@/lib/i18n/I18nProvider';
import { productCountText } from '../calorieHelpers';

type Props = {
  logs: CalorieLog[];
  onDeleted: () => void;
};

/** Selection bar Delete action; confirms in a dialog, then deletes every selected log in one request. */
export function DeleteLogsAction({ logs, onDeleted }: Props) {
  const { formatNumber, t } = useI18n();
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteFoodLogsMutation();
  const products = t(productCountText(logs.length));
  const kcal = formatNumber(Math.round(logs.reduce((sum, entry) => sum + entry.kcal, 0)));

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
        label={t({ en: 'Delete', pl: 'Usuń' })}
        render={<DialogTrigger />}
        variant='ghostDanger'
      />
      <DialogPopup>
        <DialogTitle>{t({ en: `Delete ${products}?`, pl: `Usunąć ${products}?` })}</DialogTitle>
        <DialogDescription>
          {t({
            en: `They are removed from this day, taking ${kcal} kcal off your total. This can't be undone.`,
            pl: `Zostaną usunięte z tego dnia, co odejmie ${kcal} kcal od sumy. Tego nie można cofnąć.`,
          })}
        </DialogDescription>
        <DialogActions>
          <DialogClose render={<Btn variant='ghost' />}>
            {t({ en: 'Cancel', pl: 'Anuluj' })}
          </DialogClose>
          <Btn
            icon={<Trash2Icon aria-hidden='true' />}
            loading={deleteMutation.isPending}
            onClick={confirm}
            variant='danger'
          >
            {t({ en: 'Delete', pl: 'Usuń' })}
          </Btn>
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}
