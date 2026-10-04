import { useBlocker } from '@tanstack/react-router';

/** Only a Back step during an active selection is consumed; everything else navigates. */
export function cancelsSelectionOnBack(action: string, selecting: boolean) {
  return selecting && action === 'BACK';
}

/**
 * Turns the first browser Back during a selection into "clear selection" and keeps the page.
 * The router blocker restores the popped entry, so no extra history entries pile up and the
 * next Back, with nothing selected, navigates normally.
 */
export function useCancelSelectionOnBack(selecting: boolean, clearSelection: () => void) {
  useBlocker({
    disabled: !selecting,
    enableBeforeUnload: false,
    shouldBlockFn: ({ action }) => {
      if (!cancelsSelectionOnBack(action, selecting)) return false;
      clearSelection();
      return true;
    },
  });
}
