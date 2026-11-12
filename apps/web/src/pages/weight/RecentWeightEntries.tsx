import { Link } from '@tanstack/react-router';
import { ChevronRightIcon, ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import css from './RecentWeightEntries.module.css';
import type { WeightHistoryEntry } from './weight.api';
import { getChangeDirection } from './weightCalculations';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';
import { useTodayLocalDate } from '@/lib/useTodayLocalDate';

const PAGE_SIZE = 10;
const KG_DIGITS = { maximumFractionDigits: 1, minimumFractionDigits: 1 };

/**
 * Newest-first weight log. Each row is one tap target to the entry, and older entries load in
 * place because the page already has the whole history.
 */
export function RecentWeightEntries({ entries }: { entries: WeightHistoryEntry[] }) {
  const { formatDate, formatNumber, t } = useI18n();
  const today = useTodayLocalDate();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const newestFirst = entries.toReversed();
  const remaining = newestFirst.length - visibleCount;

  return (
    <Card
      as='section'
      aria-label={t({ en: 'Weight history', pl: 'Historia wagi' })}
      className={css.card}
    >
      <ol className={css.list}>
        {newestFirst.slice(0, visibleCount).map((entry, index) => {
          const previous = newestFirst[index + 1];
          const change = previous
            ? Math.round((entry.weightKg - previous.weightKg) * 10) / 10
            : undefined;
          const sameYear = entry.date.slice(0, 4) === today.slice(0, 4);

          return (
            <li key={entry.date}>
              <Link className={css.row} params={{ date: entry.date }} to='/weight/$date'>
                <span className={css.when}>
                  <time dateTime={entry.date}>
                    {entry.date === today
                      ? t({ en: 'Today', pl: 'Dziś' })
                      : formatDate(entry.date, {
                          day: 'numeric',
                          month: 'short',
                          weekday: 'short',
                          ...(sameYear ? {} : { year: 'numeric' }),
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
                </span>
                <span className={css.weight}>{formatNumber(entry.weightKg, KG_DIGITS)} kg</span>
                <span className={css.change} data-direction={getChangeDirection(change)}>
                  {change === undefined
                    ? '—'
                    : formatNumber(change, { ...KG_DIGITS, signDisplay: 'exceptZero' })}
                </span>
                <ChevronRightIcon aria-hidden='true' className={css.chevron} />
              </Link>
            </li>
          );
        })}
      </ol>

      {remaining > 0 ? (
        <Btn
          className={css.more}
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE * 2)}
          size='sm'
          variant='ghost'
        >
          {t({
            en: `Show older (${remaining})`,
            pl: `Pokaż starsze (${remaining})`,
          })}
        </Btn>
      ) : null}
    </Card>
  );
}
