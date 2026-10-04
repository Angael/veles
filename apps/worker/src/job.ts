export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

type JobOptions = {
  name: string;
  intervalMs: number;
  /** The signal aborts on shutdown so long runs can stop early. */
  run: (signal: AbortSignal) => Promise<void>;
};

/**
 * Runs a job immediately, then `intervalMs` after each run finishes, so runs never overlap.
 * Failures are logged and never stop the schedule. `stop()` waits for the active run.
 */
export function startJob({ name, intervalMs, run }: JobOptions) {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  let activeRun: Promise<void>;

  async function tick() {
    try {
      await run(controller.signal);
    } catch (error) {
      console.error(`${name} failed`, { error: errorMessage(error) });
    }
    if (!controller.signal.aborted) {
      timer = setTimeout(() => {
        activeRun = tick();
      }, intervalMs);
    }
  }

  activeRun = tick();

  return {
    async stop() {
      controller.abort();
      clearTimeout(timer);
      await activeRun;
    },
  };
}
