import { Link } from '@tanstack/react-router';
import { ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card/Card';
import css from './WeightPage.module.css';
import type { WeightHistoryEntry } from './weight.api';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';

type RecentWeightEntriesProps = {
  entries: WeightHistoryEntry[];
};

export function RecentWeightEntries({ entries }: RecentWeightEntriesProps) {
  const { formatDate, formatNumber, t } = useI18n();
  const recentEntries = entries.slice(-8).toReversed();
  const kg = (value: number, signDisplay: 'auto' | 'exceptZero' = 'auto') =>
    `${formatNumber(value, { maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay })} kg`;

  return (
    <Card
      as='section'
      aria-label={t({ en: 'Recent weight entries', pl: 'Ostatnie pomiary wagi' })}
      className={css.entriesCard}
    >
      <div className={css.tableFrame}>
        <table className={css.entriesTable}>
          <thead>
            <tr>
              <th scope='col'>{t({ en: 'Date', pl: 'Data' })}</th>
              <th scope='col'>{t({ en: 'Weight', pl: 'Waga' })}</th>
              <th scope='col'>{t({ en: 'Change', pl: 'Zmiana' })}</th>
            </tr>
          </thead>
          <tbody>
            {recentEntries.map((entry) => {
              const previousEntry = entries[entries.indexOf(entry) - 1];
              const change = previousEntry
                ? Math.round((entry.weightKg - previousEntry.weightKg) * 10) / 10
                : undefined;

              return (
                <tr key={entry.date}>
                  <td>
                    <Link
                      className={css.entryLink}
                      params={{ date: entry.date }}
                      to='/weight/$date'
                    >
                      <time dateTime={entry.date}>
                        {formatDate(entry.date, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </time>
                      {entry.photoCount > 0 ? (
                        <span
                          aria-label={t({
                            en: `${entry.photoCount} ${pluralEn(entry.photoCount, 'photo', 'photos')}`,
                            pl: `${entry.photoCount} ${pluralPl(entry.photoCount, 'zdjęcie', 'zdjęcia', 'zdjęć')}`,
                          })}
                          className={css.photoBadge}
                        >
                          <ImageIcon aria-hidden='true' />
                          {entry.photoCount}
                        </span>
                      ) : null}
                    </Link>
                  </td>
                  <td>{kg(entry.weightKg)}</td>
                  <td
                    className={
                      change !== undefined && change < 0 ? css.deltaBetter : css.deltaNeutral
                    }
                  >
                    {change === undefined ? '—' : kg(change, 'exceptZero')}
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
