import { CopyPlusIcon } from 'lucide-react';
import { useState } from 'react';
import type { CalorieLog } from '../calories.api';
import { MAX_FOOD_LOG_MULTIPLIER } from '../calorieHelpers';
import { useMultiplyFoodLogsMutation } from '../calories.query';
import { Btn } from '@/components/ui/btn/Btn';
import { Dialog, DialogTrigger } from '@/components/ui/dialog/Dialog';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { productCount } from './selectionText';
import css from './SelectionBar.module.css';

const presets = [2, 3];

type Props = {
  logs: CalorieLog[];
  onMultiplied: () => void;
};

/** Scales the selected logs' amounts, e.g. ×2 when a second sandwich was eaten but logged as ingredients. */
export function MultiplyLogsDialog({ logs, onMultiplied }: Props) {
  const [open, setOpen] = useState(false);
  const [factor, setFactor] = useState<number | null>(2);
  const multiplyMutation = useMultiplyFoodLogsMutation();
  const valid = factor !== null && factor > 0 && factor <= MAX_FOOD_LOG_MULTIPLIER;
  const kcal = logs.reduce((sum, entry) => sum + entry.kcal, 0);

  function confirm() {
    if (!valid) return;
    multiplyMutation.mutate(
      { factor, ids: logs.map((entry) => entry.id) },
      {
        onSuccess: () => {
          setOpen(false);
          onMultiplied();
        },
      },
    );
  }

  return (
    <Dialog
      body={
        <div className={css.dialogBody}>
          <p>Grams, kcal, and macros of each selected product are multiplied.</p>
          <div className={css.factorRow}>
            {presets.map((preset) => (
              <Btn
                aria-pressed={factor === preset}
                key={preset}
                onClick={() => setFactor(preset)}
                variant={factor === preset ? 'main' : 'outlineMain'}
              >
                ×{preset}
              </Btn>
            ))}
            <NumberInput
              aria-label='Multiply by'
              className={css.factorInput}
              max={MAX_FOOD_LOG_MULTIPLIER}
              min={0.1}
              onValueChange={setFactor}
              value={factor}
            />
          </div>
          <p className={css.kcalPreview}>
            {Math.round(kcal)} kcal →{' '}
            <strong>{valid ? Math.round(kcal * factor) : '–'} kcal</strong>
          </p>
        </div>
      }
      okButtonProps={{
        disabled: !valid,
        icon: <CopyPlusIcon aria-hidden='true' />,
        loading: multiplyMutation.isPending,
        onClick: confirm,
      }}
      okLabel='Multiply'
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setFactor(2);
      }}
      open={open}
      title={`Multiply ${productCount(logs.length)}`}
      trigger={
        <Btn
          aria-label='Multiply'
          className={css.collapsible}
          icon={<CopyPlusIcon aria-hidden='true' />}
          radius='pill'
          render={<DialogTrigger />}
          variant='ghost'
        >
          <span className={css.label}>Multiply</span>
        </Btn>
      }
    />
  );
}
