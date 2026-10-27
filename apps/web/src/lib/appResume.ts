/**
 * Calls `onResume` when the app comes back to the screen.
 *
 * Installed PWAs on Android keep the page frozen in memory, so reopening the app does not reload
 * it. `visibilitychange` covers app switching and `pageshow` covers back-forward cache restores.
 */
export function subscribeAppResume(onResume: () => void) {
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') onResume();
  }
  function handlePageShow(event: PageTransitionEvent) {
    if (event.persisted) onResume();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pageshow', handlePageShow);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pageshow', handlePageShow);
  };
}
