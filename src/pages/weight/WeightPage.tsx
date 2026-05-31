import type { SVGProps } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import css from './WeightPage.module.css';

type WeightEntry = {
  date: string;
  weightKg: number;
  hasPhoto: boolean;
  note?: string;
};

const mockEntries = generateMockEntries();
const latestEntry = mockEntries[mockEntries.length - 1]!;

export function WeightPage() {
  const recentEntries = mockEntries.slice(-8).reverse();
  const currentWeight = latestEntry.weightKg;
  const twoWeekChange = getChangeFromDaysAgo(14);
  const oneMonthChange = getChangeFromDaysAgo(30);

  return (
    <main className={css.page}>
      <section className={css.summaryGrid}>
        <Card as='article' className={css.summaryCard}>
          <span className={css.statLabel}>Current kg</span>
          <strong>{formatWeight(currentWeight)}</strong>
          <p>{formatLongDate(latestEntry.date)}</p>
        </Card>
        <Card as='article' className={css.summaryCard}>
          <span className={css.statLabel}>2 week change</span>
          <strong className={twoWeekChange <= 0 ? css.deltaDown : css.deltaUp}>
            {formatSignedWeight(twoWeekChange)}
          </strong>
          <p>Compared with {formatLongDate(shiftIsoDate(latestEntry.date, -14))}</p>
        </Card>
        <Card as='article' className={css.summaryCard}>
          <span className={css.statLabel}>1 month change</span>
          <strong className={oneMonthChange <= 0 ? css.deltaDown : css.deltaUp}>
            {formatSignedWeight(oneMonthChange)}
          </strong>
          <p>Compared with {formatLongDate(shiftIsoDate(latestEntry.date, -30))}</p>
        </Card>
      </section>

      <section className={css.grid}>
        <Card as='article' className={`${css.card} ${css.captureCard}`}>
          <div className={css.cardHeader}>
            <div>
              <h2>Daily entry</h2>
            </div>
            <span className={css.mockBadge}>Mock only</span>
          </div>

          <div className={css.capturePanel}>
            <label className={css.captureField}>
              <span>Weight in kg</span>
              <div className={css.captureValue}>{formatWeight(latestEntry.weightKg)}</div>
            </label>
            <label className={css.captureField}>
              <span>Photo</span>
              <div className={css.photoPlaceholder}>
                <PhotoIcon className={css.photoIcon} />
                <strong>Optional progress photo</strong>
                <p>Kept private, attached only when it helps the trend tell the truth.</p>
              </div>
            </label>
            <Btn radius='pill' type='button' variant='primary'>
              Save flow next
            </Btn>
          </div>
        </Card>

        <Card as='article' className={css.card}>
          <div className={css.cardHeader}>
            <div>
              <h2>Recent entries</h2>
            </div>
          </div>

          <div className={css.logList}>
            {recentEntries.map((entry) => (
              <div className={css.logRow} key={entry.date}>
                <div>
                  <strong>{formatWeight(entry.weightKg)}</strong>
                  <p>{formatLongDate(entry.date)}</p>
                </div>
                <div className={css.logMeta}>
                  <span>{entry.hasPhoto ? 'Photo attached' : 'Weight only'}</span>
                  <p>{entry.note ?? 'Quiet consistency day.'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}

function getChangeFromDaysAgo(days: number) {
  const previousEntry = mockEntries[Math.max(mockEntries.length - 1 - days, 0)]!;

  return roundToOneDecimal(latestEntry.weightKg - previousEntry.weightKg);
}

function generateMockEntries() {
  const startDate = '2024-03-04';
  const endDate = '2026-05-24';
  const totalDays = getDayDistance(startDate, endDate);
  const notes = [
    'A steady morning check-in.',
    'Walk-heavy day, felt lighter.',
    'Post-training water swing.',
    'Routine day, no surprises.',
    'Weekend reset and good sleep.',
  ];

  return Array.from({ length: totalDays + 1 }, (_, index) => {
    const date = shiftIsoDate(startDate, index);
    const longTrend = 92.4 - index * 0.016;
    const monthlyWave = Math.sin(index / 15) * 0.55;
    const weeklyWave = Math.cos(index / 4.2) * 0.18;
    const rebound = index > 340 && index < 430 ? 0.8 : 0;
    const maintenance = index > 620 ? Math.sin(index / 40) * 0.4 + 0.7 : 0;
    const weightKg = roundToOneDecimal(
      longTrend + monthlyWave + weeklyWave + rebound + maintenance,
    );
    const hasPhoto = index % 17 === 0 || index % 89 === 0;

    return {
      date,
      hasPhoto,
      note: index % 4 === 0 ? notes[index % notes.length] : undefined,
      weightKg,
    };
  });
}

function formatWeight(value: number) {
  return `${value.toFixed(1)} kg`;
}

function formatSignedWeight(value: number) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)} kg`;
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseIsoDate(value));
}

function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function shiftIsoDate(value: string, days: number) {
  const nextDate = parseIsoDate(value);

  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate.toISOString().slice(0, 10);
}

function getDayDistance(startDate: string, endDate: string) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round(
    (parseIsoDate(endDate).getTime() - parseIsoDate(startDate).getTime()) / millisecondsPerDay,
  );
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function PhotoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}>
      <path
        d='M7.5 7.5 9 5.25h6l1.5 2.25H19.5A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V9a1.5 1.5 0 0 1 1.5-1.5z'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.5'
      />
      <circle cx='12' cy='13' r='3.25' stroke='currentColor' strokeWidth='1.5' />
    </svg>
  );
}
