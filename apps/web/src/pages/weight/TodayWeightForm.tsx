import { useRouter } from '@tanstack/react-router';
import { CircleCheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import css from './WeightPage.module.css';
import type { WeightEntry } from './weight.api';
import { useSaveWeightMutation } from './weight.query';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useTodayLocalDate } from '@/lib/useTodayLocalDate';

const KG_DIGITS = { maximumFractionDigits: 1, minimumFractionDigits: 1 };

/**
 * Daily one-tap logging. Starts from the latest weight so a small stepper nudge is usually all it
 * takes, and turns into an update once today already has an entry.
 */
export function TodayWeightForm({ latestEntry }: { latestEntry: WeightEntry | undefined }) {
  const { formatNumber, t } = useI18n();
  const router = useRouter();
  const today = useTodayLocalDate();
  const [weightKg, setWeightKg] = useState<number | null>(latestEntry?.weightKg ?? null);
  const saveMutation = useSaveWeightMutation();
  const savedToday = latestEntry?.date === today ? latestEntry : undefined;

  useEffect(() => {
    setWeightKg(latestEntry?.weightKg ?? null);
  }, [latestEntry?.weightKg]);

  function submitWeight() {
    if (weightKg === null) {
      return;
    }

    saveMutation.mutate(
      { data: { date: today, weightKg } },
      { onSuccess: () => void router.invalidate().catch(() => undefined) },
    );
  }

  return (
    <Card
      as='section'
      aria-label={t({ en: 'Today’s weight', pl: 'Dzisiejsza waga' })}
      className={css.capture}
    >
      <TypedForm className={css.captureForm} onSubmit={submitWeight}>
        <div className={css.captureLabel}>
          <span aria-hidden='true'>{t({ en: 'Today’s weight', pl: 'Dzisiejsza waga' })}</span>
          {savedToday ? (
            <span className={css.savedBadge}>
              <CircleCheckIcon aria-hidden='true' />
              {t({
                en: `Saved ${formatNumber(savedToday.weightKg, KG_DIGITS)} kg`,
                pl: `Zapisano ${formatNumber(savedToday.weightKg, KG_DIGITS)} kg`,
              })}
            </span>
          ) : null}
        </div>
        <NumberInput
          aria-label={t({
            en: 'Today’s weight in kilograms',
            pl: 'Dzisiejsza waga w kilogramach',
          })}
          enterKeyHint='done'
          max={300}
          min={30}
          onValueChange={setWeightKg}
          placeholder={t({ en: '0.0', pl: '0,0' })}
          size='lg'
          stepperStep={0.1}
          suffix='kg'
          value={weightKg}
        />
        <Btn
          disabled={weightKg === null || weightKg === savedToday?.weightKg}
          loading={saveMutation.isPending}
          radius='pill'
          size='lg'
          type='submit'
        >
          {savedToday ? t({ en: 'Update', pl: 'Zmień' }) : t({ en: 'Save', pl: 'Zapisz' })}
        </Btn>
      </TypedForm>
    </Card>
  );
}
