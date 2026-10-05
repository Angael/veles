import clsx from 'clsx';
import { CopyIcon, LayersIcon, Trash2Icon } from 'lucide-react';
import { describeSet, parseSetShorthand } from '../setShorthand';
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

/** Typewriter: the example appears letter by letter, then turns into its set chips. */
export function TypeSetsDemo({ example = '80x5x3' }: { example?: string }) {
  const progress = useTimeline(3600, 0.8);
  const typed = example.slice(0, Math.floor(phase(progress, 0.05, 0.45) * example.length));
  const { sets } = parseSetShorthand(example);
  const chips = Math.floor(phase(progress, 0.5, 0.7) * sets.length);
  return (
    <div aria-hidden='true' className={css.stageColumn}>
      <span className={css.fakeInput}>
        {typed}
        <span className={css.caret} />
      </span>
      <span className={css.fakeChips}>
        {sets.slice(0, chips).map((set, index) => (
          <span className={css.fakeChip} key={index}>
            {describeSet(set)}
          </span>
        ))}
      </span>
    </div>
  );
}
