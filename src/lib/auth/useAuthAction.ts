import { useState } from 'react';

/**
 * Wraps login/signup client calls with shared busy and error state for auth forms.
 */
export function useAuthAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAuthAction(action: () => Promise<void>, fallbackMessage: string) {
    setBusy(true);
    setError(null);

    try {
      await action();
    } catch (error) {
      setError(error instanceof Error ? error.message : fallbackMessage);
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
