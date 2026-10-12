import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { WorkoutSessionData } from './workouts.server';
import type { WorkoutSummary } from './workouts.api';

const mocks = vi.hoisted(() => ({ workouts: [] as WorkoutSummary[] }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useSuspenseQuery: () => ({ data: mocks.workouts }) }));
vi.mock('./workouts.query', () => ({
  useUpdateWorkoutMutation: () => ({ mutate: vi.fn(), isPending: false }),
  workoutsQueryOptions: vi.fn(),
}));
vi.mock('./session/SessionMenu', () => ({ SessionMenu: () => null }));

import { SessionHeader } from './session/SessionHeader';
import { WorkoutStats } from './dashboard/WorkoutStats';

const session: WorkoutSessionData = {
  id: 'session',
  name: 'Logged afterwards',
  date: '2026-10-12',
  routine: null,
  startedAt: '2026-10-12T10:00:00Z',
  endedAt: '2026-10-12T10:00:10Z',
  slots: [
    {
      id: 'slot',
      exerciseId: 'exercise',
      name: 'Run',
      measure: 'distance_duration',
      restSeconds: null,
      note: '',
      previousNote: null,
      sets: [
        {
          id: 'done',
          type: 'normal',
          done: true,
          previous: null,
          durationSeconds: 600,
          weightKg: null,
          reps: null,
          distanceKm: 2,
        },
        {
          id: 'planned',
          type: 'normal',
          done: false,
          previous: null,
          durationSeconds: 3600,
          weightKg: null,
          reps: null,
          distanceKm: 10,
        },
      ],
    },
  ],
};

function header(data: WorkoutSessionData) {
  return renderToStaticMarkup(
    <SessionHeader session={data} onFinish={() => {}} onShowHints={() => {}} />,
  );
}

describe('workout duration displays', () => {
  it('shows completed exercise time on the finished session, not the short logging timer', () => {
    expect(header(session)).toContain('<dd>10:00</dd>');
  });

  it('preserves longer elapsed time in the session header', () => {
    expect(header({ ...session, endedAt: '2026-10-12T11:00:00Z' })).toContain('<dd>60:00</dd>');
  });

  it('uses the same floor after reopening and optimistic edits to the completed sets', () => {
    expect(header({ ...session, endedAt: null })).toContain('<dd>10:00</dd>');
    const edited = structuredClone(session);
    const set = edited.slots[0]?.sets[0];
    if (!set) throw new Error('Missing test set.');
    set.durationSeconds = 1200;
    expect(header(edited)).toContain('<dd>20:00</dd>');
    set.done = false;
    expect(header(edited)).toContain('<dd>0:10</dd>');
  });

  it('averages effective finished durations rather than raw timestamps, excluding open workouts', () => {
    const summary: WorkoutSummary = {
      id: 'session',
      name: session.name,
      date: session.date,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationSeconds: 600,
      exerciseCount: 1,
      doneSets: 1,
      volumeKg: 0,
    };
    mocks.workouts = [
      summary,
      { ...summary, id: 'second', durationSeconds: 1800 },
      { ...summary, id: 'open', endedAt: null, durationSeconds: null },
    ];
    expect(renderToStaticMarkup(<WorkoutStats />)).toContain(
      '<dt>Average length</dt><dd>20 min</dd>',
    );
  });
});
