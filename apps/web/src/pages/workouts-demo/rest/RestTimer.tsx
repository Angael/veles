import clsx from 'clsx';
import { XIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import dock from '@/components/ui/mobile-dock/MobileDock.module.css';
import { formatDuration } from '../mockData';
import type { RestTimer } from './useRestTimer';
import css from './RestTimer.module.css';

/** Feeds the drain animation; CSS scales the fill by `--rest-progress`. */
const progressStyle = (timer: RestTimer): CSSProperties & { '--rest-progress': number } => ({
  '--rest-progress': timer.total > 0 ? Math.min(1, Math.max(0, timer.remaining / timer.total)) : 0,
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
 * Takes over the phone dock like `SelectionBar` (and the floating button spot on
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
