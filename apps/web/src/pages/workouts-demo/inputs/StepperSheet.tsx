import { HistoryIcon, MinusIcon, PlusIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import css from './Inputs.module.css';

export type StepperValue = { weightKg: number; reps: number };

type StepperSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  previous: StepperValue;
  value: StepperValue;
  onChange: (value: StepperValue) => void;
  onDone: () => void;
};

const PLATE_STEPS = [-5, -2.5, 1.25, 2.5, 5, 10];

/**
 * Bottom sheet (Dialog docks to the bottom on phones) with huge numbers and thumb-sized
 * steppers. No keyboard needed for the usual "same weight, one more rep" change.
 */
export function StepperSheet({
  onChange,
  onDone,
  onOpenChange,
  open,
  previous,
  title,
  value,
}: StepperSheetProps) {
  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup className={css.sheet}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Last time: {previous.weightKg} kg × {previous.reps}
        </DialogDescription>

        <div className={css.bigRow}>
          <Stepper
            label='kg'
            onChange={(weightKg) => onChange({ ...value, weightKg })}
            step={2.5}
            value={value.weightKg}
          />
          <span aria-hidden='true' className={css.times}>
            ×
          </span>
          <Stepper
            label='reps'
            onChange={(reps) => onChange({ ...value, reps })}
            step={1}
            value={value.reps}
          />
        </div>

        <div className={css.plateRow}>
          {PLATE_STEPS.map((delta) => (
            <button
              className={css.plate}
              key={delta}
              onClick={() => onChange({ ...value, weightKg: Math.max(0, value.weightKg + delta) })}
              type='button'
            >
              {delta > 0 ? '+' : '−'}
              {Math.abs(delta)}
            </button>
          ))}
          <button className={css.plate} onClick={() => onChange(previous)} type='button'>
            <HistoryIcon aria-hidden='true' /> last
          </button>
        </div>

        <DialogActions>
          <DialogClose render={<Btn variant='ghost' />}>Cancel</DialogClose>
          <Btn onClick={onDone}>Done, start rest</Btn>
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}

type StepperProps = {
  label: string;
  onChange: (value: number) => void;
  step: number;
  value: number;
};

function Stepper({ label, onChange, step, value }: StepperProps) {
  return (
    <div className={css.stepper}>
      <button
        aria-label={`Less ${label}`}
        onClick={() => onChange(Math.max(0, value - step))}
        type='button'
      >
        <MinusIcon aria-hidden='true' />
      </button>
      <span className={css.bigNumber}>
        {value}
        <small>{label}</small>
      </span>
      <button aria-label={`More ${label}`} onClick={() => onChange(value + step)} type='button'>
        <PlusIcon aria-hidden='true' />
      </button>
    </div>
  );
}
