import { CopyPlusIcon } from 'lucide-react';
import { useState } from 'react';
import type { CalorieLog } from '../calories.api';
import { useMultiplyFoodLogsMutation } from '../calories.query';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { SelectionBarAction } from '@/components/ui/selection-bar/SelectionBar';
import css from './MultiplyLogsAction.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { MAX_FOOD_LOG_MULTIPLIER, productCountText } from '../calorieHelpers';

/** ×½ covers the opposite case: half a portion eaten but a full one logged. */
const presets = [
  { factor: 0.5, label: '×½' },
  { factor: 2, label: '×2' },
  { factor: 3, label: '×3' },
];

type Props = {
  logs: CalorieLog[];
  onMultiplied: () => void;
};

/** Selection bar Multiply action opening the multiply dialog for every selected log. */
export function MultiplyLogsAction({ logs, onMultiplied }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <SelectionBarAction
        icon={<CopyPlusIcon aria-hidden='true' />}
        label={t({ en: 'Multiply', pl: 'Pomnóż' })}
        onClick={() => setOpen(true)}
      />
      <MultiplyLogsDialog
        logs={logs}
        onMultiplied={onMultiplied}
        onOpenChange={setOpen}
        open={open}
      />
    </>
  );
}

type DialogProps = {
  logs: CalorieLog[];
  onMultiplied?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

/** Scales the logs' amounts, e.g. ×2 when a second sandwich was eaten but logged as ingredients. */
export function MultiplyLogsDialog({ logs, onMultiplied, onOpenChange, open }: DialogProps) {
  const { t } = useI18n();
  const products = t(productCountText(logs.length));

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogTitle>{t({ en: `Multiply ${products}`, pl: `Pomnóż ${products}` })}</DialogTitle>
        <DialogDescription>
          {t({
            en: 'Grams, kcal, and macros of each product are multiplied.',
            pl: 'Gramy, kcal i makroskładniki każdego produktu zostaną pomnożone.',
          })}
        </DialogDescription>
        <MultiplyForm
          logs={logs}
          onMultiplied={() => {
            onOpenChange(false);
            onMultiplied?.();
          }}
        />
      </DialogPopup>
    </DialogRoot>
  );
}

/** Mounts with the popup, so the factor resets to ×2 every time the dialog opens. */
function MultiplyForm({ logs, onMultiplied }: Props) {
  const { formatNumber, t } = useI18n();
  const [factor, setFactor] = useState<number | null>(2);
  const multiplyMutation = useMultiplyFoodLogsMutation();
  const valid = factor !== null && factor > 0 && factor <= MAX_FOOD_LOG_MULTIPLIER;
  const kcal = logs.reduce((sum, entry) => sum + entry.kcal, 0);

  function confirm() {
    if (!valid || multiplyMutation.isPending) return;
    multiplyMutation.mutate(
      { factor, ids: logs.map((entry) => entry.id) },
      { onSuccess: onMultiplied },
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
      <div className={css.factorRow}>
        {presets.map((preset) => (
          <Btn
            aria-pressed={factor === preset.factor}
            key={preset.factor}
            onClick={() => setFactor(preset.factor)}
            type='button'
            variant={factor === preset.factor ? 'main' : 'outlineMain'}
          >
            {preset.label}
          </Btn>
        ))}
        <NumberInput
          aria-label={t({ en: 'Multiply by', pl: 'Pomnóż przez' })}
          className={css.factorInput}
          enterKeyHint='done'
          max={MAX_FOOD_LOG_MULTIPLIER}
          min={0.1}
          onValueChange={setFactor}
          value={factor}
        />
      </div>
      <p className={css.kcalPreview}>
        {formatNumber(Math.round(kcal))} kcal →{' '}
        <strong>{valid ? formatNumber(Math.round(kcal * factor)) : '–'} kcal</strong>
      </p>
      <DialogActions>
        <DialogClose render={<Btn type='button' variant='ghost' />}>
          {t({ en: 'Cancel', pl: 'Anuluj' })}
        </DialogClose>
        <Btn
          disabled={!valid}
          icon={<CopyPlusIcon aria-hidden='true' />}
          loading={multiplyMutation.isPending}
          type='submit'
        >
          {t({ en: 'Multiply', pl: 'Pomnóż' })}
        </Btn>
      </DialogActions>
    </form>
  );
}
