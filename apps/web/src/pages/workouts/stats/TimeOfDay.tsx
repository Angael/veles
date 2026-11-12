import { useSyncExternalStore } from 'react';
import { Card } from '@/components/ui/card/Card';
import css from './WorkoutStats.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Localized } from '@/lib/i18n/locale';

type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

const DAY_PARTS: { part: DayPart; label: Localized; when: Localized; persona: Localized }[] = [
  {
    label: { en: 'Morning', pl: 'Rano' },
    part: 'morning',
    persona: { en: 'Early bird', pl: 'Ranny ptaszek' },
    when: { en: 'in the morning', pl: 'rano' },
  },
  {
    label: { en: 'Afternoon', pl: 'Popołudnie' },
    part: 'afternoon',
    persona: { en: 'Afternoon athlete', pl: 'Popołudniowy sportowiec' },
    when: { en: 'in the afternoon', pl: 'po południu' },
  },
  {
    label: { en: 'Evening', pl: 'Wieczór' },
    part: 'evening',
    persona: { en: 'Evening warrior', pl: 'Wieczorny wojownik' },
    when: { en: 'in the evening', pl: 'wieczorem' },
  },
  {
    label: { en: 'Night', pl: 'Noc' },
    part: 'night',
    persona: { en: 'Night owl', pl: 'Nocny marek' },
    when: { en: 'at night', pl: 'w nocy' },
  },
];

/** Morning 5–12, afternoon 12–17, evening 17–22, night otherwise. */
function dayPart(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

const subscribeNever = () => () => {};

/**
 * When the user usually starts a workout, as a persona. Start times are bucketed in the browser's
 * time zone, which the server does not know, so the card renders only after hydration.
 */
export function TimeOfDay({ startedAt }: { startedAt: string[] }) {
  const { formatNumber, t } = useI18n();
  const isClient = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  if (!isClient || startedAt.length === 0) return null;

  const counts = DAY_PARTS.map(
    ({ part }) => startedAt.filter((iso) => dayPart(new Date(iso).getHours()) === part).length,
  );
  const max = Math.max(...counts);
  const top = DAY_PARTS[counts.indexOf(max)];
  if (!top) return null;

  return (
    <Card as='section' className={css.section} data-appear='4' tone='sky'>
      <h2>{t(top.persona)}</h2>
      <p className={css.lead}>
        {t({
          en: `Most of your workouts start ${t(top.when)}.`,
          pl: `Najczęściej zaczynasz trening ${t(top.when)}.`,
        })}
      </p>
      <ul className={css.dayParts}>
        {DAY_PARTS.map(({ label, part }, index) => (
          <li data-top={part === top.part ? '' : undefined} key={part}>
            <span>{t(label)}</span>
            <strong>
              {formatNumber((counts[index] ?? 0) / startedAt.length, { style: 'percent' })}
            </strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
