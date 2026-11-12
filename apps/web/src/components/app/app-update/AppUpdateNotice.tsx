import { type } from 'arktype';
import { useEffect, useEffectEvent } from 'react';
import { toastManager } from '@/components/ui/toast/toastManager';
import { subscribeAppResume } from '@/lib/appResume';
import { useI18n } from '@/lib/i18n/I18nProvider';

const CHECK_INTERVAL_MS = 60_000;
const TOAST_ID = 'app-update';
const versionResponse = type({ buildId: 'string' });

/**
 * Shows a toast with a "Refresh" action when the server runs a newer build than this page.
 *
 * Installed PWAs resume a frozen old page instead of loading the new release. A silent reload
 * could drop unsaved input, so the user decides when to refresh.
 */
export function AppUpdateNotice() {
  const { t } = useI18n();
  const showToast = useEffectEvent(() => {
    toastManager.add({
      actionProps: {
        children: t({ en: 'Refresh', pl: 'Odśwież' }),
        onClick: () => window.location.reload(),
      },
      description: t({
        en: 'Refresh the page to use the latest version.',
        pl: 'Odśwież stronę, aby używać najnowszej wersji.',
      }),
      id: TOAST_ID,
      timeout: 0,
      title: t({ en: 'New version available', pl: 'Dostępna nowa wersja' }),
    });
  });

  useEffect(() => {
    let lastCheck = 0;
    let notified = false;

    async function check() {
      if (notified || Date.now() - lastCheck < CHECK_INTERVAL_MS) return;
      lastCheck = Date.now();
      const buildId = await fetchServerBuildId();
      if (!buildId || buildId === __BUILD_ID__) return;

      notified = true;
      showToast();
    }

    return subscribeAppResume(() => void check());
  }, []);

  return null;
}

async function fetchServerBuildId() {
  try {
    const response = await fetch('/api/version', { cache: 'no-store' });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    return versionResponse.allows(body) ? body.buildId : null;
  } catch {
    // Offline or mid-deploy; the next resume tries again.
    return null;
  }
}
