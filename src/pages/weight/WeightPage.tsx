import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { ScaleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { NumberInput } from '@/components/number-input/NumberInput';
import { toastManager } from '@/components/toast/toastManager';
import css from './WeightPage.module.css';
import { WeightTrendChart } from './WeightTrendChart';
import { saveWeight, type WeightEntry } from './weight.api';

type WeightPageProps = {
  entries: WeightEntry[];
};

export function WeightPage({ entries }: WeightPageProps) {
  const router = useRouter();
  const latestEntry = entries.at(-1);
  const [weightKg, setWeightKg] = useState<number | null>(latestEntry?.weightKg ?? null);
  const saveMutation = useMutation({
    mutationFn: saveWeight,
    onError: () => {
      toastManager.add({
        description: 'Your weight was not changed. Please try again.',
        priority: 'high',
        title: 'Could not save weight',
        type: 'error',
      });
    },
    onSuccess: async () => {
      await router.invalidate();
    },
  });

  useEffect(() => {
    setWeightKg(latestEntry?.weightKg ?? null);
  }, [latestEntry?.weightKg]);

  const recentEntries = entries.slice(-8).reverse();
  const twoWeekChange = getChangeFromDaysAgo(entries, 14);
  const oneMonthChange = getChangeFromDaysAgo(entries, 30);

  function submitWeight() {
    if (weightKg === null) {
      return;
    }

    saveMutation.mutate({ data: { date: getLocalDate(), weightKg } });
  }

  return (
    <main className={css.page}>
      {entries.length === 0 ? (
        <Card as='section' className={css.emptyState}>
          <div className={css.emptyIcon}>
            <ScaleIcon aria-hidden='true' size={28} strokeWidth={1.7} />
          </div>
          <div className={css.emptyCopy}>
            <h1>Start tracking your weight</h1>
            <p>Add today&apos;s weight to begin building your trend and progress summary.</p>
          </div>
          <WeightForm
            isSaving={saveMutation.isPending}
            onChange={setWeightKg}
            onSubmit={submitWeight}
            value={weightKg}
          />
        </Card>
      ) : (
        <>
          <WeightTrendChart entries={entries} />

          <div className={css.summaryRail}>
            <Card as='section' aria-label='Weight summary' className={css.summaryGrid}>
              <SummaryStat label='Current' value={formatWeight(latestEntry!.weightKg)} />
              <SummaryStat label='2 weeks' value={formatChange(twoWeekChange)} />
              <SummaryStat label='1 month' value={formatChange(oneMonthChange)} />
            </Card>
          </div>

          <Card as='section' aria-label='Recent weight entries' className={css.entriesCard}>
            <WeightForm
              isSaving={saveMutation.isPending}
              onChange={setWeightKg}
              onSubmit={submitWeight}
              value={weightKg}
            />

            <div className={css.tableFrame}>
              <table className={css.entriesTable}>
                <thead>
                  <tr>
                    <th scope='col'>Date</th>
                    <th scope='col'>Weight</th>
                    <th scope='col'>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map((entry) => {
                    const entryIndex = entries.indexOf(entry);
                    const previousEntry = entries[entryIndex - 1];
                    const change = previousEntry
                      ? roundToOneDecimal(entry.weightKg - previousEntry.weightKg)
                      : undefined;

                    return (
                      <tr key={entry.date}>
                        <td>
                          <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                        </td>
                        <td>{formatWeight(entry.weightKg)}</td>
                        <td className={getDeltaClassName(change)}>{formatChange(change)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </main>
  );
}

type WeightFormProps = {
  isSaving: boolean;
  onChange: (value: number | null) => void;
  onSubmit: () => void;
  value: number | null;
};

function WeightForm({ isSaving, onChange, onSubmit, value }: WeightFormProps) {
  return (
    <form
      className={css.entryForm}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className={css.captureField}>
        <span>Today&apos;s weight</span>
        <NumberInput
          aria-label="Today's weight in kilograms"
          className={css.weightInput}
          inputClassName={css.weightInputField}
          max={300}
          min={30}
          onValueChange={onChange}
          placeholder='kg'
          required
          step={0.1}
          value={value}
        />
      </label>
      <Btn disabled={value === null} loading={isSaving} radius='pill' size='sm' type='submit'>
        Save
      </Btn>
    </form>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  const isImprovement = value.startsWith('-');

  return (
    <div className={css.summaryStat}>
      <span className={css.statLabel}>{label}</span>
      <strong className={isImprovement ? css.deltaBetter : css.deltaNeutral}>{value}</strong>
    </div>
  );
}

function getChangeFromDaysAgo(entries: WeightEntry[], days: number) {
  const latestEntry = entries.at(-1);

  if (!latestEntry) {
    return undefined;
  }

  const targetDate = shiftIsoDate(latestEntry.date, -days);
  const previousEntry = entries.findLast((entry) => entry.date <= targetDate);

  return previousEntry
    ? roundToOneDecimal(latestEntry.weightKg - previousEntry.weightKg)
    : undefined;
}

function getDeltaClassName(value: number | undefined) {
  return value !== undefined && value < 0 ? css.deltaBetter : css.deltaNeutral;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatWeight(value: number) {
  return `${value.toFixed(1)} kg`;
}

function formatChange(value: number | undefined) {
  if (value === undefined) {
    return '—';
  }

  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)} kg`;
}

function shiftIsoDate(value: string, days: number) {
  const nextDate = new Date(`${value}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

function getLocalDate() {
  const now = new Date();
  const localNow = new Date(now.valueOf() - now.getTimezoneOffset() * 60_000);
  return localNow.toISOString().slice(0, 10);
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}
