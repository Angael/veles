import { useState } from 'react';

/**
 * Wraps authentication client calls with shared busy and error state for the sign-in view.
 */
export function useAuthAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAuthAction(action: () => Promise<void>, fallbackMessage: string) {
    setBusy(true);
    setError(null);

    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : fallbackMessage);
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
    runAuthAction,
    setError,
  };
}
