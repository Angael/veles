import clsx from 'clsx';
import { ChevronLeftIcon, ChevronRightIcon, PointerIcon } from 'lucide-react';
import { useLoop } from './useHints';
import css from './Hints.module.css';

const DRAG_FRAMES = [
  { value: '80', x: 0, press: false },
  { value: '80', x: 0, press: true },
  { value: '80.5', x: 6, press: true },
  { value: '81', x: 12, press: true },
  { value: '85', x: 34, press: true },
  { value: '90', x: 52, press: true },
  { value: '90', x: 52, press: false },
  { value: '90', x: 52, press: false },
];

/** Finger presses a cell and slides right: slow ticks first, then a fast flick jumps ahead. */
export function DragDemo() {
  const frame = DRAG_FRAMES[useLoop(DRAG_FRAMES.length, 450, 4)] ?? DRAG_FRAMES[0];
  return (
    <div aria-hidden='true' className={css.stage}>
      <div className={clsx(css.fakeCell, frame?.press && css.fakeCellActive)}>
        <ChevronLeftIcon />
        <span>{frame?.value}</span>
        <ChevronRightIcon />
      </div>
      <PointerIcon
        className={clsx(css.finger, frame?.press && css.fingerPressed)}
        style={{ translate: `${(frame?.x ?? 0) - 20}px 0.6rem` }}
      />
    </div>
  );
}

/** Tap a number, the big editor drops from the top. */
export function TapSheetDemo() {
  const frame = useLoop(6, 600, 3);
  const open = frame >= 2 && frame <= 4;
  return (
    <div aria-hidden='true' className={css.stage}>
      <div className={clsx(css.miniSheet, open && css.miniSheetOpen)}>
        <span>−</span>
        <b>82.5</b>
        <span>+</span>
      </div>
      <div className={css.fakeRowSmall}>
        <span>2</span>
        <span className={clsx(css.fakeCellSmall, frame === 1 && css.fakeCellActive)}>80</span>
        <span className={css.fakeCellSmall}>5</span>
      </div>
      <PointerIcon
        className={clsx(css.finger, frame === 1 && css.fingerPressed)}
        style={{ opacity: frame <= 1 ? 1 : 0, translate: '-0.2rem 1.4rem' }}
      />
    </div>
  );
}
