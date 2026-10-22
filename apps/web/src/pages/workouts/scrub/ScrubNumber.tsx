import type { ReactNode } from 'react';
import type { ScrubTier } from './useScrub';
import css from './Scrub.module.css';

/** True when the smallest step makes decimals, e.g. 0.5 kg; reps and time stay whole. */
export const hasFraction = (tiers: ScrubTier[]) =>
  tiers.some((tier) => !Number.isInteger(tier.step));

/**
 * Formatted number pinned at its decimal point: the whole part ends at a fixed spot and the
 * fraction and unit follow it. So 20 → 20.5 → 21 keeps "20" still, and "20 kg" stays tight.
 */
export function ScrubNumber({
  fraction,
  suffix,
  text,
}: {
  fraction: boolean;
  suffix?: ReactNode;
  text: string;
}) {
  const match = fraction ? /^(.*?)([.,]\d*)?$/.exec(text) : null;
  if (!match) {
    return (
      <>
        {text}
        {suffix}
      </>
    );
  }
  return (
    <span className={css.anchored}>
      <span className={css.whole}>{match[1]}</span>
      <span className={css.fraction}>
        {match[2]}
        {suffix}
      </span>
    </span>
  );
}
