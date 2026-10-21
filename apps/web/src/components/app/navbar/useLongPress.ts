import { type PointerEvent, type MouseEvent, useRef, useState } from 'react';

const HOLD_MS = 500;
const MOVE_TOLERANCE_PX = 10;

/**
 * Press-and-hold detector for the phone dock. Exposes `pressing` for hold feedback, fires
 * `onLongPress` after the hold, and swallows the click that follows so a held link does not
 * navigate. The native context menu (Android long-press, desktop right-click) also triggers it.
 */
/** React bubbles portal events to the dock; ignore presses inside its dialogs. */
function isOwnTarget(event: MouseEvent) {
  return event.target instanceof Node && event.currentTarget.contains(event.target);
}

export function useLongPress(onLongPress: () => void) {
  const [pressing, setPressing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const start = useRef({ x: 0, y: 0 });
  const fired = useRef(false);

  const cancel = () => {
    clearTimeout(timer.current);
    setPressing(false);
  };

  const fire = () => {
    cancel();
    fired.current = true;
    // The opened dialog's backdrop takes the pointer, so the native menu fires outside the dock.
    const block = (event: Event) => event.preventDefault();
    window.addEventListener('contextmenu', block, { capture: true });
    setTimeout(() => window.removeEventListener('contextmenu', block, { capture: true }), 1000);
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onLongPress();
  };

  return {
    pressing,
    handlers: {
      onPointerDown: (event: PointerEvent) => {
        if (event.button !== 0 || !isOwnTarget(event)) {
          return;
        }
        fired.current = false;
        start.current = { x: event.clientX, y: event.clientY };
        setPressing(true);
        timer.current = setTimeout(fire, HOLD_MS);
      },
      onPointerMove: (event: PointerEvent) => {
        const dx = event.clientX - start.current.x;
        const dy = event.clientY - start.current.y;
        if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) {
          cancel();
        }
      },
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onPointerLeave: cancel,
      onContextMenu: (event: MouseEvent) => {
        if (!isOwnTarget(event)) {
          return;
        }
        event.preventDefault();
        if (!fired.current) {
          fire();
        }
      },
      onClickCapture: (event: MouseEvent) => {
        if (fired.current) {
          fired.current = false;
          event.preventDefault();
          event.stopPropagation();
        }
      },
    },
  };
}
