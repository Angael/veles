import { useBlocker } from '@tanstack/react-router';
import { useCallback, useRef } from 'react';

/**
 * Asks with a native `confirm()` before leaving a form with unsaved edits, including reloads and
 * tab closes. Dirty state lives in a ref so typing never re-renders the form.
 * Call `markSaved()` before navigating away after a successful save.
 */
export function useUnsavedChangesGuard() {
  const dirty = useRef(false);

  useBlocker({
    enableBeforeUnload: () => dirty.current,
    shouldBlockFn: () => dirty.current && !window.confirm('Discard unsaved changes?'),
  });

  const markDirty = useCallback(() => {
    dirty.current = true;
  }, []);
  const markSaved = useCallback(() => {
    dirty.current = false;
  }, []);

  return { markDirty, markSaved };
}
