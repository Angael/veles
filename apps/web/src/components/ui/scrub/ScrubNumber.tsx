import type { ScrubTier } from './useScrub';
import css from './Scrub.module.css';

/** Most decimal digits any step makes, e.g. 1 for 0.5 kg; 0 for reps and time. */
export const stepDecimals = (tiers: ScrubTier[]) =>
  Math.max(0, ...tiers.map((tier) => String(tier.step).split('.')[1]?.length ?? 0));

/**
 * Formatted number padded with greyed zeros to the decimals the steps can make, so
 * 20 → 20.5 → 21 shows as 20.0 → 20.5 → 21.0 and its width does not jump.
 */
export function ScrubNumber({
  decimals,
  format,
  value,
}: {
  decimals: number;
  format: (value: number) => string;
  value: number;
}) {
  const text = format(value);
  if (decimals === 0) return text;
  // Read the locale's decimal separator from the formatter itself ("0.5" or "0,5").
  const separator = format(0.5).replace(/\d/g, '') || '.';
  const [whole = text, digits = ''] = text.split(separator);
  const pad = '0'.repeat(Math.max(0, decimals - digits.length));
  // The fraction span stays mounted so its opacity can transition between real and padded digits.
  return (
    <>
      {whole}
      <span className={css.fractionDigits} data-padded={digits === '' || undefined}>
        {separator}
        {digits}
        {digits !== '' && pad !== '' ? <span className={css.padDigits}>{pad}</span> : pad}
      </span>
    </>
  );
}
