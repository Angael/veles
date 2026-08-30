import { Link, useRouter } from '@tanstack/react-router';
import { format } from 'date-fns';
import { CalendarPlusIcon, FileUpIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { NumberInput } from '@/components/number-input/NumberInput';
import { toastManager } from '@/components/toast/toastManager';
import { RecentWeightEntries } from './RecentWeightEntries';
import css from './WeightPage.module.css';
import { WeightTrendChart } from './WeightTrendChart';
import { getChangeFromDaysAgo, type WeightChartRange } from './weightCalculations';
import type { WeightEntry } from './weight.api';
import { useSaveWeightMutation } from './weight.query';

type WeightPageProps = {
  entries: WeightEntry[];
  initialChartRange: WeightChartRange;
};

export function WeightPage({ entries, initialChartRange }: WeightPageProps) {
  const router = useRouter();
  const latestEntry = entries.at(-1);
  const [weightKg, setWeightKg] = useState<number | null>(latestEntry?.weightKg ?? null);
  const saveMutation = useSaveWeightMutation();

  useEffect(() => {
    setWeightKg(latestEntry?.weightKg ?? null);
  }, [latestEntry?.weightKg]);

  const twoWeekChange = getChangeFromDaysAgo(entries, 14);
  const oneMonthChange = getChangeFromDaysAgo(entries, 30);

  function submitWeight() {
    if (weightKg === null) {
      return;
    }

    saveMutation.mutate(
      { data: { date: format(new Date(), 'yyyy-MM-dd'), weightKg } },
      {
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
      },
    );
  }

  return (
    <main className={css.page}>
      {entries.length > 0 && (
        <div data-appear>
          <WeightTrendChart entries={entries} initialRange={initialChartRange} />
        </div>
      )}

      <section aria-label="Today's weight" className={css.captureContainer} data-appear='1'>
        <WeightForm
          isSaving={saveMutation.isPending}
          onChange={setWeightKg}
          onSubmit={submitWeight}
          value={weightKg}
        />
        <div className={css.captureActions}>
          <Btn
            icon={<FileUpIcon aria-hidden='true' />}
            isLink
            render={<Link to='/weight/import' />}
            size='md'
            variant='outlineMain'
          >
            Import
          </Btn>
          <Btn
            icon={<CalendarPlusIcon aria-hidden='true' />}
            isLink
            render={<Link to='/weight/add' />}
            size='md'
            variant='outlineMain'
          >
            Add for date
          </Btn>
        </div>
      </section>

      {entries.length > 0 ? (
        <>
          <div className={css.summaryRail} data-appear='2'>
            <Card as='section' aria-label='Weight summary' className={css.summaryGrid}>
              {/* oxlint-disable-next-line typescript/no-non-null-assertion -- entries.length > 0 guarantees a latest entry. */}
              <SummaryStat label='Current' value={`${latestEntry!.weightKg.toFixed(1)} kg`} />
              <SummaryStat label='2 weeks' value={formatChange(twoWeekChange)} />
              <SummaryStat label='1 month' value={formatChange(oneMonthChange)} />
            </Card>
          </div>

          <div data-appear='3'>
            <RecentWeightEntries entries={entries} />
          </div>
        </>
      ) : (
        <Card as='section' className={css.emptyState} data-appear='2'>
          <h1>Start tracking your weight</h1>
          <p>Add today&apos;s weight or import your history to begin building your trend.</p>
        </Card>
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
      <Btn disabled={value === null} loading={isSaving} radius='pill' size='md' type='submit'>
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

function formatChange(value: number | undefined) {
  if (value === undefined) {
    return '—';
  }

  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)} kg`;
}
