import clsx from 'clsx';
import { CopyIcon, LayersIcon, Trash2Icon } from 'lucide-react';
import { Pointer } from './Pointer';
import { phase, useCoarsePointer, useTimeline } from './useHints';
import css from './Hints.module.css';

/** Press and hold a row: a ring fills around the press point, then the menu pops. */
export function LongPressDemo() {
  const progress = useTimeline(3600, 0.6);
  const coarse = useCoarsePointer();
  const approach = phase(progress, 0, 0.12);
  const hold = phase(progress, 0.15, 0.45);
  const pressed = progress > 0.14 && progress < 0.5;
  const menu = progress > 0.46 && progress < 0.9;
  const circumference = 2 * Math.PI * 14;

  return (
    <div aria-hidden='true' className={css.stage}>
      <div className={clsx(css.fakeRowSmall, menu && css.fakeRowHighlighted)}>
        <span>2</span>
        <span className={css.fakeCellSmall}>80</span>
        <span className={css.fakeCellSmall}>5</span>
      </div>
      <svg className={css.holdRing} style={{ opacity: pressed ? 1 : 0 }} viewBox='0 0 32 32'>
        <circle
          cx='16'
          cy='16'
          r='14'
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - hold)}
        />
      </svg>
      <Pointer
        coarse={coarse}
        pressed={pressed}
        visible={!menu}
        x={(1 - approach) * 30}
        y={(1 - approach) * 24}
      />
      <ul className={clsx(css.miniMenu, menu && css.miniMenuShown)}>
        <li>
          <LayersIcon /> Type
        </li>
        <li>
          <CopyIcon /> Duplicate
        </li>
        <li>
          <Trash2Icon /> Delete
        </li>
      </ul>
    </div>
  );
}

const SET_TYPE_STEPS = [
  { badge: '1', className: undefined, label: 'Normal' },
  { badge: 'W', className: css.typeBadgeWarmup, label: 'Warm-up' },
  { badge: 'D', className: css.typeBadgeDrop, label: 'Drop set' },
  { badge: 'F', className: css.typeBadgeFailure, label: 'To failure' },
];

/** Taps the set number four times, cycling normal → warm-up → drop → failure → normal. */
export function SetTypeDemo() {
  const progress = useTimeline(5200, 0.45);
  const coarse = useCoarsePointer();
  const approach = phase(progress, 0, 0.1);
  const taps = [0.2, 0.4, 0.6, 0.8];
  const pressed = taps.some((at) => progress > at - 0.03 && progress < at + 0.02);
  const step = SET_TYPE_STEPS[taps.filter((at) => progress >= at).length % SET_TYPE_STEPS.length];

  return (
    <div aria-hidden='true' className={css.stage}>
      <span className={clsx(css.typeBadge, step?.className)}>{step?.badge}</span>
      <span className={css.typeLabel}>{step?.label}</span>
      <Pointer coarse={coarse} pressed={pressed} x={(1 - approach) * 30} y={(1 - approach) * 24} />
    </div>
  );
}
