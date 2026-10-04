import { format, parseISO } from 'date-fns';
import { CalendarArrowUpIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import type { CalorieLog } from '../calories.api';
import { useCopyFoodLogsMutation, useMoveFoodLogsMutation } from '../calories.query';
import { dateOnlyType, todayLocalDate } from '@/lib/dateOnly';
import { Btn } from '@/components/ui/btn/Btn';
import { DateInput } from '@/components/ui/date-input/DateInput';
import {
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { Label } from '@/components/ui/label/Label';
import { SelectionBarAction } from '@/components/ui/selection-bar/SelectionBar';
import { toastManager } from '@/components/ui/toast/toastManager';
import css from './LogsDateAction.module.css';

export type LogsDateMode = 'copy' | 'move';

const modes = {
  copy: {
    description: 'Copies keep the same amounts, kcal, and macros.',
    done: 'Copied',
    icon: <CopyIcon aria-hidden='true' />,
    label: 'Copy',
  },
  move: {
    description: 'Products leave this day and are added to the chosen one.',
    done: 'Moved',
    icon: <CalendarArrowUpIcon aria-hidden='true' />,
    label: 'Move',
  },
} satisfies Record<LogsDateMode, object>;

export const logsDateModeIcon = (mode: LogsDateMode) => modes[mode].icon;

const productCount = (count: number) => `${count} ${count === 1 ? 'product' : 'products'}`;

type ActionProps = {
  date: string;
  logs: CalorieLog[];
  mode: LogsDateMode;
  onDone: () => void;
};

/** Selection bar Move or Copy action opening the date dialog for every selected log. */
export function LogsDateAction({ date, logs, mode, onDone }: ActionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SelectionBarAction
        icon={modes[mode].icon}
        label={modes[mode].label}
        onClick={() => setOpen(true)}
      />
      <LogsDateDialog
        date={date}
        logs={logs}
        mode={mode}
        onDone={onDone}
        onOpenChange={setOpen}
        open={open}
      />
    </>
  );
}

type DialogProps = Omit<ActionProps, 'onDone'> & {
  onDone?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

/** Picks the day the logs are moved or copied to. */
export function LogsDateDialog({ date, logs, mode, onDone, onOpenChange, open }: DialogProps) {
  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogTitle>
          {modes[mode].label} {productCount(logs.length)}
        </DialogTitle>
        <DialogDescription>{modes[mode].description}</DialogDescription>
        <LogsDateForm
          date={date}
          logs={logs}
          mode={mode}
          onDone={() => {
            onOpenChange(false);
            onDone?.();
          }}
        />
      </DialogPopup>
    </DialogRoot>
  );
}

/** Mounts with the popup, so the target resets to today every time the dialog opens. */
function LogsDateForm({ date, logs, mode, onDone }: ActionProps) {
  const [target, setTarget] = useState(todayLocalDate);
  const moveMutation = useMoveFoodLogsMutation();
  const copyMutation = useCopyFoodLogsMutation();
  const mutation = mode === 'move' ? moveMutation : copyMutation;
  const valid = dateOnlyType.allows(target) && (mode === 'copy' || target !== date);

  function confirm() {
    if (!valid || mutation.isPending) return;
    mutation.mutate(
      { date: target, ids: logs.map((entry) => entry.id) },
      {
        onSuccess: () => {
          toastManager.add({
            title: `${modes[mode].done} ${productCount(logs.length)} to ${format(parseISO(target), 'EEE, d MMM')}`,
            type: 'success',
          });
          onDone();
        },
      },
    );
  }

  return (
    <form
      className={css.form}
      onSubmit={(event) => {
        event.preventDefault();
        confirm();
      }}
    >
      <Label text='Date'>
        <DateInput enterKeyHint='done' onValueChange={setTarget} required value={target} />
      </Label>
      <DialogActions>
        <DialogClose render={<Btn type='button' variant='ghost' />}>Cancel</DialogClose>
        <Btn disabled={!valid} icon={modes[mode].icon} loading={mutation.isPending} type='submit'>
          {modes[mode].label}
        </Btn>
      </DialogActions>
    </form>
  );
}
