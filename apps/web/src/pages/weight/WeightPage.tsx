import { Card } from '@/components/ui/card/Card';
import { RecentWeightEntries } from './RecentWeightEntries';
import { TodayWeightForm } from './TodayWeightForm';
import css from './WeightPage.module.css';
import { WeightOverview } from './WeightOverview';
import type { WeightChartRange } from './weightCalculations';
import type { WeightHistoryEntry } from './weight.api';
import { useI18n } from '@/lib/i18n/I18nProvider';

type WeightPageProps = {
  entries: WeightHistoryEntry[];
  initialChartRange: WeightChartRange;
};

export function WeightPage({ entries, initialChartRange }: WeightPageProps) {
  const { t } = useI18n();

  if (entries.length === 0) {
    return (
      <main className={css.page}>
        <Card as='section' className={css.emptyState} data-appear>
          <h1>{t({ en: 'Start tracking your weight', pl: 'Zacznij śledzić wagę' })}</h1>
          <p>
            {t({
              en: 'Log today’s weight below. Coming from another app? Import your history from the ⋯ menu.',
              pl: 'Zapisz dzisiejszą wagę poniżej. Masz dane z innej aplikacji? Zaimportuj historię z menu ⋯.',
            })}
          </p>
        </Card>
        <div data-appear='1'>
          <TodayWeightForm latestEntry={undefined} />
        </div>
      </main>
    );
  }

  return (
    <main className={css.page}>
      <div data-appear>
        <WeightOverview entries={entries} initialRange={initialChartRange} />
      </div>
      <div data-appear='1'>
        <TodayWeightForm latestEntry={entries.at(-1)} />
      </div>
      <div data-appear='2'>
        <RecentWeightEntries entries={entries} />
      </div>
    </main>
  );
}
