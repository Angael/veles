import { useSyncExternalStore } from 'react';

/**
 * In-memory "server" for the TanStack DB demo page. Each lane gets its own table, so the
 * React Query lane and the TanStack DB lane can be compared side by side. Every call waits
 * `latencyMs` and can be forced to fail once, which makes optimistic updates and rollbacks
 * visible without a real backend.
 */

export type DemoItem = {
  checked: boolean;
  createdAt: number;
  id: string;
  name: string;
};

export type DemoLane = 'db' | 'rq';

export type DemoLogEntry = {
  at: number;
  id: number;
  lane: DemoLane;
  text: string;
  tone: 'error' | 'ok' | 'request' | 'ui';
};

type DemoState = {
  failNextWrite: boolean;
  inFlight: Record<DemoLane, number>;
  latencyMs: number;
  log: DemoLogEntry[];
};

const startedAt = Date.now();
let nextLogId = 1;
let state: DemoState = {
  failNextWrite: false,
  inFlight: { db: 0, rq: 0 },
  latencyMs: 1200,
  log: [],
};
const listeners = new Set<() => void>();

function setState(patch: (current: DemoState) => Partial<DemoState>) {
  state = { ...state, ...patch(state) };
  for (const listener of listeners) listener();
}

export function useDemoState() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
}

export function setLatency(latencyMs: number) {
  setState(() => ({ latencyMs }));
}

export function setFailNextWrite(failNextWrite: boolean) {
  setState(() => ({ failNextWrite }));
}

export function clearLog() {
  setState(() => ({ log: [] }));
}

export function logDemoEvent(lane: DemoLane, tone: DemoLogEntry['tone'], text: string) {
  const entry = { at: Date.now() - startedAt, id: nextLogId++, lane, text, tone };
  setState((current) => ({ log: [entry, ...current.log].slice(0, 60) }));
}

const seedNames = ['Milk', 'Oats', 'Eggs'];

function seedRows(): Map<string, DemoItem> {
  return new Map(
    seedNames.map((name, index) => {
      const id = crypto.randomUUID();
      return [id, { checked: index === 1, createdAt: index, id, name }];
    }),
  );
}

/** Creates one fake table plus REST-like endpoints that log every request they serve. */
function createLaneServer(lane: DemoLane) {
  const rows = seedRows();

  /** Waits for the current latency, then runs `apply`; write calls may fail on purpose. */
  async function request<T>(label: string, apply: () => T, isWrite: boolean): Promise<T> {
    logDemoEvent(lane, 'request', `${label} sent`);
    setState((current) => ({
      inFlight: { ...current.inFlight, [lane]: current.inFlight[lane] + 1 },
    }));
    const shouldFail = isWrite && state.failNextWrite;
    if (shouldFail) setFailNextWrite(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, state.latencyMs));
      if (shouldFail) {
        logDemoEvent(lane, 'error', `${label} failed (500)`);
        throw new Error(`${label} failed`);
      }
      const result = apply();
      logDemoEvent(lane, 'ok', `${label} ok`);
      return result;
    } finally {
      setState((current) => ({
        inFlight: { ...current.inFlight, [lane]: current.inFlight[lane] - 1 },
      }));
    }
  }

  return {
    list: () =>
      request(
        'GET /items',
        () => [...rows.values()].toSorted((a, b) => a.createdAt - b.createdAt),
        false,
      ),
    create: (item: Pick<DemoItem, 'id' | 'name'>) =>
      request(
        `POST /items "${item.name}"`,
        () => {
          rows.set(item.id, { ...item, checked: false, createdAt: Date.now() });
        },
        true,
      ),
    update: (id: string, changes: Partial<Pick<DemoItem, 'checked' | 'name'>>) =>
      request(
        `PATCH /items/${id.slice(0, 4)} ${JSON.stringify(changes)}`,
        () => {
          const row = rows.get(id);
          if (row) rows.set(id, { ...row, ...changes });
        },
        true,
      ),
    remove: (id: string) =>
      request(
        `DELETE /items/${id.slice(0, 4)}`,
        () => {
          rows.delete(id);
        },
        true,
      ),
  };
}

export const rqServer = createLaneServer('rq');
export const dbServer = createLaneServer('db');
