import { useId } from 'react';
import css from './VelesLogo.module.css';

// Head-to-tail opacity: eight 2.5%-long dashes approximate a fading 20% trail without blur.
const trailOpacities = [0.9, 0.72, 0.55, 0.4, 0.28, 0.18, 0.1, 0.04];

/**
 * Stationary wordmark with a fading entrance and a CSS-driven, 24-second elliptical orbit.
 * Identical planet/trail copies are clipped at the orbit's local midline and painted around
 * the text: back first, letters second, front last. Keep both copies and rotations in sync.
 */
export function VelesLogo() {
  const id = useId();
  const planet = `${id}-planet`;
  const glow = `${id}-glow`;
  const back = `${id}-back`;
  const front = `${id}-front`;
  const orbitPath = `${id}-orbit`;

  // pathLength=100 makes dash units percentages of the orbit. At phase zero, the trail
  // occupies 80–100 behind the planet; negative dashoffset advances it in the planet's direction.
  const trail = (
    <g className={css.trail}>
      {trailOpacities.map((opacity, index) => (
        <use
          href={`#${orbitPath}`}
          key={opacity}
          opacity={opacity}
          strokeDasharray={`0 ${100 - (index + 1) * 2.5} 2.5 ${index * 2.5}`}
        />
      ))}
    </g>
  );

  // A static radial gradient supplies the glow; no animated filter or JS frame loop.
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
        <path d='M284 55a134 32 0 1 1-268 0a134 32 0 1 1 268 0' id={orbitPath} pathLength='100' />
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
        <g clipPath={`url(#${back})`}>
          {trail}
          {satellite}
        </g>
      </g>
      <text className={css.wordmark} textAnchor='middle' x='150' y='80'>
        Veles
      </text>
      <g className={css.orbit} transform='rotate(-10 150 55)'>
        <path className={css.nearRing} d='M284 55a134 32 0 0 1-268 0' />
        <g clipPath={`url(#${front})`}>
          {trail}
          {satellite}
        </g>
      </g>
    </svg>
  );
}
