import clsx from 'clsx';
import { TimerIcon, XIcon } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import dock from '@/components/ui/mobile-dock/MobileDock.module.css';
import { formatDuration } from '../mockData';
import type { RestTimer } from './useRestTimer';
import css from './RestTimer.module.css';

export type RestVariant = 'dock' | 'bubble' | 'inline';

const progressOf = (timer: RestTimer) =>
  timer.total > 0 ? Math.min(1, Math.max(0, timer.remaining / timer.total)) : 0;

/** Feeds the drain animation; CSS scales the fill by `--rest-progress`. */
const progressStyle = (timer: RestTimer): CSSProperties & { '--rest-progress': number } => ({
  '--rest-progress': progressOf(timer),
});

/** Big clock text; flips to "+0:12 over" once rest is done so you notice you're dawdling. */
function Clock({ timer }: { timer: RestTimer }) {
  const over = timer.remaining <= 0;
  return (
    <span className={clsx(css.clock, over && css.over)}>
      {over ? `+${formatDuration(-timer.remaining)}` : formatDuration(Math.ceil(timer.remaining))}
    </span>
  );
}

/**
 * Variant A: takes over the phone dock like `SelectionBar` (and the floating button spot on
 * desktop). The pill itself drains as a progress bar.
 */
export function RestDock({ timer }: { timer: RestTimer }) {
  if (!timer.running) return null;
  return (
    <div
      aria-label='Rest timer'
      className={clsx(dock.dock, css.dock, 'floatingButton', 'selectionBar')}
      role='timer'
      style={progressStyle(timer)}
    >
      <Btn onClick={() => timer.adjust(-15)} radius='pill' size='sm' variant='ghost'>
        −15
      </Btn>
      <div className={css.dockCenter}>
        <Clock timer={timer} />
        <span className={css.dockLabel}>{timer.label}</span>
      </div>
      <Btn onClick={() => timer.adjust(15)} radius='pill' size='sm' variant='ghost'>
        +15
      </Btn>
      <Btn
        aria-label='Skip rest'
        icon={<XIcon aria-hidden='true' />}
        iconOnly
        onClick={timer.skip}
        radius='pill'
        size='sm'
        variant='ghost'
      />
    </div>
  );
}

/**
 * Variant B: a small ring in the corner. Tap to grow it; long press / right click for the rest
 * of the actions, so the default view stays one number.
 */
export function RestBubble({ timer }: { timer: RestTimer }) {
  const [expanded, setExpanded] = useState(false);
  if (!timer.running) return null;
  const circumference = 2 * Math.PI * 44;

  return (
    <ContextMenuRoot>
      <ContextMenuTrigger
        className={clsx(css.bubble, expanded && css.bubbleExpanded)}
        render={<button aria-label='Rest timer' onClick={() => setExpanded((v) => !v)} />}
      >
        <svg aria-hidden='true' className={css.ring} viewBox='0 0 100 100'>
          <circle className={css.ringTrack} cx='50' cy='50' r='44' />
          <circle
            className={css.ringFill}
            cx='50'
            cy='50'
            r='44'
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progressOf(timer))}
          />
        </svg>
        <Clock timer={timer} />
        {expanded ? <span className={css.dockLabel}>{timer.label}</span> : null}
      </ContextMenuTrigger>
      <ContextMenuPopup aria-label='Rest timer actions'>
        <ContextMenuItem icon={<TimerIcon />} label='+15 s' onClick={() => timer.adjust(15)} />
        <ContextMenuItem icon={<TimerIcon />} label='+1 min' onClick={() => timer.adjust(60)} />
        <ContextMenuItem icon={<TimerIcon />} label='−15 s' onClick={() => timer.adjust(-15)} />
        <ContextMenuSeparator />
        <ContextMenuItem icon={<XIcon />} label='Skip rest' onClick={timer.skip} variant='danger' />
      </ContextMenuPopup>
    </ContextMenuRoot>
  );
}

/**
 * Variant C: lives inside the exercise card, right under the set you just finished. Context is
 * obvious ("resting after set 2") and nothing floats over the page.
 */
export function RestInline({ timer }: { timer: RestTimer }) {
  return (
    <div className={css.inline} role='timer' style={progressStyle(timer)}>
      <TimerIcon aria-hidden='true' />
      <Clock timer={timer} />
      <span className={css.inlineActions}>
        <button onClick={() => timer.adjust(-15)} type='button'>
          −15
        </button>
        <button onClick={() => timer.adjust(15)} type='button'>
          +15
        </button>
        <button onClick={timer.skip} type='button'>
          Skip
        </button>
      </span>
    </div>
  );
}
