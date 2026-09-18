import { useId } from 'react';
import css from './VelesLogo.module.css';

/** Clips one synchronized orbit around the wordmark so its far side passes behind the letters. */
export function VelesLogo() {
  const id = useId();
  const planet = `${id}-planet`;
  const glow = `${id}-glow`;
  const back = `${id}-back`;
  const front = `${id}-front`;

  const satellite = (
    <g className={css.planet}>
      <circle fill={`url(#${glow})`} r='13' />
      <circle fill={`url(#${planet})`} r='5' />
    </g>
  );

  return (
    <svg
      aria-label='Veles'
      className={css.logo}
      height='110'
      role='img'
      viewBox='0 0 300 110'
      width='300'
    >
      <defs>
        <radialGradient id={planet} cx='30%' cy='25%' r='80%'>
          <stop offset='0' stopColor='var(--c-text-strong)' />
          <stop offset='.35' stopColor='var(--c-accent)' />
          <stop offset='1' stopColor='var(--c-primary)' />
        </radialGradient>
        <radialGradient id={glow}>
          <stop offset='0' stopColor='var(--c-accent)' stopOpacity='.5' />
          <stop offset='1' stopColor='var(--c-accent)' stopOpacity='0' />
        </radialGradient>
        <clipPath id={back}>
          <path d='M0 0H300V55H0Z' />
        </clipPath>
        <clipPath id={front}>
          <path d='M0 55H300V110H0Z' />
        </clipPath>
      </defs>
      <g className={css.orbit} transform='rotate(-10 150 55)'>
        <path className={css.farRing} d='M16 55a134 32 0 0 1 268 0' />
        <g clipPath={`url(#${back})`}>{satellite}</g>
      </g>
      <text className={css.wordmark} textAnchor='middle' x='150' y='80'>
        Veles
      </text>
      <g className={css.orbit} transform='rotate(-10 150 55)'>
        <path className={css.nearRing} d='M284 55a134 32 0 0 1-268 0' />
        <g clipPath={`url(#${front})`}>{satellite}</g>
      </g>
    </svg>
  );
}
