import clsx from 'clsx';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { rulerStyle } from '../scrub/ScrubCell';
import { Pointer } from './Pointer';
import { phase, useCoarsePointer, useTimeline } from './useHints';
import css from './Hints.module.css';

/** Value shown for a given drag distance: 0.5 steps while slow, then 2.5 and 5 when flicked. */
function demoValue(slow: number, fast: number) {
  if (fast <= 0) return 80 + Math.round(slow * 3) * 0.5;
  if (fast < 0.35) return 82.5;
  if (fast < 0.7) return 85;
  return 90;
}

/**
 * Pointer presses a cell, drags slowly (80 → 81.5), then flicks (→ 90). On touch the finger moves
 * left to increase, like pulling a ruler; on desktop the cursor moves right.
 */
export function DragDemo() {
  const progress = useTimeline(4200, 0.6);
  const coarse = useCoarsePointer();
  const direction = coarse ? -1 : 1;

  const approach = phase(progress, 0, 0.12);
  const slow = phase(progress, 0.18, 0.5);
  const fast = phase(progress, 0.55, 0.66);
  const pressed = progress > 0.14 && progress < 0.72;
  const travel = (slow * 14 + fast * 46) * direction;
  const value = progress < 0.18 ? 80 : demoValue(slow, fast);

  return (
    <div aria-hidden='true' className={css.stage}>
      <div className={clsx(css.fakeCell, pressed && css.fakeCellActive)} style={rulerStyle(travel)}>
        <ChevronLeftIcon />
        <span>{value}</span>
        <ChevronRightIcon />
      </div>
      <Pointer
        coarse={coarse}
        pressed={pressed}
        x={travel + (1 - approach) * 30}
        y={(1 - approach) * 24}
      />
    </div>
  );
}
