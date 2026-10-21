import type { ScrubTier } from './useScrub';
import css from './Scrub.module.css';

/** Decimal places the smallest step can produce, e.g. 0.5 → 1, 0.25 → 2, 5 → 0. */
export const fractionDigits = (tiers: ScrubTier[]) =>
  Math.max(0, ...tiers.map((tier) => String(tier.step).split('.')[1]?.length ?? 0));

/**
 * Formatted number with a fixed-width slot for its decimal part, so 20 → 20.5 → 21 keeps the
 * whole part still instead of shifting the centred text sideways.
 */
export function ScrubNumber({ digits, text }: { digits: number; text: string }) {
  if (digits === 0) return text;
  const match = /^(.*?)([.,]\d*)?$/.exec(text);
  return (
    <>
      {match?.[1] ?? text}
      <span className={css.fraction} style={{ minWidth: `${digits + 1}ch` }}>
        {match?.[2]}
      </span>
    </>
  );
}
