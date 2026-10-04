import { Link } from '@tanstack/react-router';
import { CopyPlusIcon, PencilIcon, SquareCheckIcon, SquareIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { FoodSummary } from '../FoodSummary';
import type { CalorieLog } from '../calories.api';
import { useDeleteFoodLogMutation } from '../calories.query';
import { type LogsDateMode, LogsDateDialog, logsDateModeIcon } from './LogsDateAction';
import { MultiplyLogsDialog } from './MultiplyLogsAction';
import { Btn } from '@/components/ui/btn/Btn';
import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import {
  ContextMenuItem,
  ContextMenuLinkItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { ListItem } from '@/components/ui/list/List';
import css from './LoggedFood.module.css';

type LoggedFoodProps = {
  date: string;
  entry: CalorieLog;
  onSelectedChange: (id: string, selected: boolean) => void;
  selected: boolean;
};

/** Logged food row; right click or long press opens per-entry actions. */
export function LoggedFood({ date, entry, onSelectedChange, selected }: LoggedFoodProps) {
  const deleteMutation = useDeleteFoodLogMutation();
  const [multiplyOpen, setMultiplyOpen] = useState(false);
  // Mode outlives `open` so the dialog keeps its title while animating closed.
  const [dateDialog, setDateDialog] = useState<{ mode: LogsDateMode; open: boolean }>({
    mode: 'move',
    open: false,
  });

  function remove() {
    deleteMutation.mutate({ date, id: entry.id });
  }

  return (
    <>
      <ContextMenuRoot>
        <ContextMenuTrigger
          render={<ListItem className={css.item} selected={selected} style={{ padding: 0 }} />}
        >
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
        </ContextMenuTrigger>
        <ContextMenuPopup aria-label={`${entry.name} actions`}>
          <ContextMenuLinkItem
            icon={<PencilIcon aria-hidden='true' />}
            label='Edit'
            render={<Link params={{ logId: entry.id }} to='/calories/logs/$logId' />}
          />
          <ContextMenuItem
            icon={<CopyPlusIcon aria-hidden='true' />}
            label='Multiply…'
            onClick={() => setMultiplyOpen(true)}
          />
          <ContextMenuItem
            icon={logsDateModeIcon('move')}
            label='Move to…'
            onClick={() => setDateDialog({ mode: 'move', open: true })}
          />
          <ContextMenuItem
            icon={logsDateModeIcon('copy')}
            label='Copy to…'
            onClick={() => setDateDialog({ mode: 'copy', open: true })}
          />
          <ContextMenuItem
            icon={
              selected ? <SquareCheckIcon aria-hidden='true' /> : <SquareIcon aria-hidden='true' />
            }
            label={selected ? 'Deselect' : 'Select'}
            onClick={() => onSelectedChange(entry.id, !selected)}
          />
          <ContextMenuSeparator />
          <ContextMenuItem
            icon={<Trash2Icon aria-hidden='true' />}
            label='Delete'
            onClick={remove}
            variant='danger'
          />
        </ContextMenuPopup>
      </ContextMenuRoot>
      <MultiplyLogsDialog logs={[entry]} onOpenChange={setMultiplyOpen} open={multiplyOpen} />
      <LogsDateDialog
        date={date}
        logs={[entry]}
        mode={dateDialog.mode}
        onOpenChange={(open) => setDateDialog((current) => ({ ...current, open }))}
        open={dateDialog.open}
      />
    </>
  );
}
