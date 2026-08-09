import type { CSSProperties } from 'react';
import type { CalorieLog, CalorieTotals } from './calories.api';
import { FlameIcon, UtensilsIcon } from 'lucide-react';
import { Card } from '@/components/card/Card';
import css from './CaloriesPage.module.css';

type CalorieOverviewProps = {
  goalKcal: number | null;
  logs: CalorieLog[];
  totals: CalorieTotals;
};

type ProgressStyle = CSSProperties & {
  '--progress': string;
};

export function CalorieOverview({ goalKcal, logs, totals }: CalorieOverviewProps) {
  const remaining = goalKcal === null ? null : goalKcal - totals.kcal;
  const progress = goalKcal ? Math.min((totals.kcal / goalKcal) * 100, 100) : 0;
  const progressStyle: ProgressStyle = { '--progress': `${progress}%` };
  return (
    <div className={css.overviewStack}>
      <Card as='section' className={css.hero}>
        <div className={css.heroCopy}>
          <span className={css.sectionLabel}>Today</span>
          <div className={css.energyLine}>
            <strong>{formatNumber(totals.kcal)}</strong>
            <span>kcal logged</span>
          </div>
          <p>
            {remaining === null
              ? 'Set a daily goal to see your remaining energy.'
              : remaining >= 0
                ? `${formatNumber(remaining)} kcal remaining`
                : `${formatNumber(Math.abs(remaining))} kcal over your goal`}
          </p>
        </div>
        <div
          aria-label={
            goalKcal ? `${Math.round(progress)} percent of daily goal` : 'No daily goal set'
          }
          className={css.progress}
          role='img'
          style={progressStyle}
        >
          <FlameIcon aria-hidden='true' />
          <span>{goalKcal ? `${Math.round(progress)}%` : '—'}</span>
        </div>
        <div aria-hidden='true' className={css.progressTrack}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </Card>

      <div aria-label='Macronutrient totals' className={css.macroGrid}>
        <MacroStat className={css.protein} label='Protein' value={totals.protein} />
        <MacroStat className={css.carbs} label='Carbs' value={totals.carbs} />
        <MacroStat className={css.fat} label='Fat' value={totals.fat} />
      </div>

      <Card as='section' className={css.logCard}>
        <div className={css.sectionHeading}>
          <div>
            <h2>Today&apos;s log</h2>
            <p>
              {logs.length === 0
                ? 'Your day is ready for its first entry.'
                : `${logs.length} ${logs.length === 1 ? 'entry' : 'entries'}`}
            </p>
          </div>
        </div>
        {logs.length === 0 ? (
          <div className={css.emptyLog}>
            <UtensilsIcon aria-hidden='true' />
            <strong>No food logged yet</strong>
            <span>Scan a package or add calories with the tools alongside.</span>
          </div>
        ) : (
          <ol className={css.logList}>
            {logs.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{entry.name}</strong>
                  <span>{formatEntryDetail(entry)}</span>
                </div>
                <span className={css.logEnergy}>{formatNumber(entry.kcal)} kcal</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

function MacroStat({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: number | null;
}) {
  return (
    <Card className={`${css.macroStat} ${className}`} shadow={false}>
      <span>{label}</span>
      <strong>{value === null ? '—' : `${formatNumber(value)} g`}</strong>
    </Card>
  );
}

function formatEntryDetail(entry: CalorieLog) {
  const time = new Date(entry.consumedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return entry.grams === null ? time : `${formatNumber(entry.grams)} g · ${time}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}
