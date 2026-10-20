import { useBlocker } from '@tanstack/react-router';
import { useCallback, useRef } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';

/**
 * Asks with a native `confirm()` before leaving a form with unsaved edits, including reloads and
 * tab closes. Dirty state lives in a ref so typing never re-renders the form.
 * Call `markSaved()` before navigating away after a successful save.
 */
export function useUnsavedChangesGuard() {
  const { t } = useI18n();
  const dirty = useRef(false);

  useBlocker({
    enableBeforeUnload: () => dirty.current,
    shouldBlockFn: () =>
      dirty.current &&
      !window.confirm(t({ en: 'Discard unsaved changes?', pl: 'Odrzucić niezapisane zmiany?' })),
  });

  const markDirty = useCallback(() => {
    dirty.current = true;
  }, []);
  const markSaved = useCallback(() => {
    dirty.current = false;
  }, []);

  return { markDirty, markSaved };
}
