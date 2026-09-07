import { format, parseISO } from 'date-fns';
import { Card } from '@/components/card/Card';
import css from './WeightPage.module.css';
import type { WeightEntry } from './weight.api';

type RecentWeightEntriesProps = {
  entries: WeightEntry[];
};

export function RecentWeightEntries({ entries }: RecentWeightEntriesProps) {
  const recentEntries = entries.slice(-8).toReversed();

  return (
    <Card as='section' aria-label='Recent weight entries' className={css.entriesCard}>
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
              const previousEntry = entries[entries.indexOf(entry) - 1];
              const change = previousEntry
                ? Math.round((entry.weightKg - previousEntry.weightKg) * 10) / 10
                : undefined;
              const changePrefix = change !== undefined && change > 0 ? '+' : '';

              return (
                <tr key={entry.date}>
                  <td>
                    <time dateTime={entry.date}>{format(parseISO(entry.date), 'MMM d, yyyy')}</time>
                  </td>
                  <td>{entry.weightKg.toFixed(1)} kg</td>
                  <td
                    className={
                      change !== undefined && change < 0 ? css.deltaBetter : css.deltaNeutral
                    }
                  >
                    {change === undefined ? '—' : `${changePrefix}${change.toFixed(1)} kg`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
