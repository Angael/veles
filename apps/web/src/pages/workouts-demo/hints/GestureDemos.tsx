import clsx from 'clsx';
import { CheckIcon, CopyIcon, LayersIcon, PointerIcon, Trash2Icon } from 'lucide-react';
import { useLoop } from './useHints';
import css from './Hints.module.css';

/** Tick a set, the rest pill slides up and starts counting. */
export function TickRestDemo() {
  const frame = useLoop(8, 500, 4);
  const done = frame >= 2;
  return (
    <div aria-hidden='true' className={css.stage}>
      <div className={css.fakeRowSmall}>
        <span>1</span>
        <span className={css.fakeCellSmall}>80</span>
        <span className={css.fakeCellSmall}>5</span>
        <span className={clsx(css.fakeCheck, done && css.fakeCheckDone)}>
          <CheckIcon />
        </span>
      </div>
      <PointerIcon
        className={clsx(css.finger, frame === 1 && css.fingerPressed)}
        style={{ opacity: frame <= 1 ? 1 : 0, translate: '3.2rem 0.9rem' }}
      />
      <div className={clsx(css.miniDock, done && css.miniDockShown)}>
        1:{String(30 - Math.max(0, frame - 2)).padStart(2, '0')}
      </div>
    </div>
  );
}

/** Hold a row, a ring fills, the menu pops. */
export function LongPressDemo() {
  const frame = useLoop(9, 380, 6);
  const holding = frame >= 1 && frame <= 4;
  const menu = frame >= 5 && frame <= 7;
  return (
    <div aria-hidden='true' className={css.stage}>
      <div className={clsx(css.fakeRowSmall, menu && css.fakeRowHighlighted)}>
        <span>2</span>
        <span className={css.fakeCellSmall}>80</span>
        <span className={css.fakeCellSmall}>5</span>
      </div>
      <span
        className={clsx(css.pressRing, holding && css.pressRingGrowing)}
        style={{ scale: holding ? String(0.4 + frame * 0.2) : '0.3' }}
      />
      <PointerIcon
        className={clsx(css.finger, holding && css.fingerPressed)}
        style={{ opacity: menu ? 0 : 1, translate: '0 0.9rem' }}
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

const TYPED = '80x5x3';

/** Typewriter: `80x5x3` appears letter by letter, then turns into three set chips. */
export function TypeSetsDemo() {
  const frame = useLoop(TYPED.length + 6, 260, TYPED.length + 2);
  const typed = TYPED.slice(0, frame);
  const chips = frame > TYPED.length ? Math.min(3, frame - TYPED.length) : 0;
  return (
    <div aria-hidden='true' className={css.stageColumn}>
      <span className={css.fakeInput}>
        {typed}
        <span className={css.caret} />
      </span>
      <span className={css.fakeChips}>
        {Array.from({ length: chips }, (_, index) => (
          <span className={css.fakeChip} key={index}>
            80 × 5
          </span>
        ))}
      </span>
    </div>
  );
}
