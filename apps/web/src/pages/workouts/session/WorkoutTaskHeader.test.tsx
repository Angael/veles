import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { WorkoutSessionData } from '../workouts.server';
import { SessionSummary } from './SessionSummary';
import { WorkoutActions } from './WorkoutTaskHeader';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import type { Locale } from '@/lib/i18n/locale';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: 'workout-1' }),
}));

vi.mock('../workouts.query', () => ({
  useMoveWorkoutMutation: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateWorkoutMutation: () => ({ isPending: false, mutate: vi.fn() }),
  workoutKeys: { session: (id: string) => ['session', id] },
  workoutSessionQueryOptions: (id: string) => ({ queryFn: vi.fn(), queryKey: ['session', id] }),
}));

vi.mock('./session.query', () => ({ settleSessionEdits: vi.fn() }));

vi.mock('../routines/routines.query', () => ({
  useSaveRoutineFromWorkoutMutation: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateRoutineFromWorkoutMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));

const session = (endedAt: string | null): WorkoutSessionData => ({
  date: '2026-11-05',
  endedAt,
  id: 'workout-1',
  name: 'Push',
  routine: null,
  slots: [],
  startedAt: '2026-11-05T10:00:00.000Z',
});

/** Task header actions as the route renders them, with the session already in the cache. */
function renderActions(data: WorkoutSessionData, locale: Locale = 'en') {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['session', data.id], data);
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <I18nProvider locale={locale}>
        <WorkoutActions />
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe('workout task header', () => {
  it('keeps Finish in the sticky header while the workout runs', () => {
    const markup = renderActions(session(null));

    expect(markup).toContain('aria-label="Finish workout"');
    expect(markup).toContain('>Finish<');
    expect(markup).toContain('aria-label="More workout actions"');
  });

  it('translates Finish to Polish', () => {
    const markup = renderActions(session(null), 'pl');

    expect(markup).toContain('aria-label="Zakończ trening"');
    expect(markup).toContain('>Zakończ<');
  });

  it('drops Finish once the workout has ended', () => {
    const markup = renderActions(session('2026-11-05T11:00:00.000Z'));

    expect(markup).not.toContain('Finish workout');
    expect(markup).toContain('aria-label="More workout actions"');
  });

  it('leaves Finish out of the summary card and marks a finished workout', () => {
    const render = (data: WorkoutSessionData) =>
      renderToStaticMarkup(
        <I18nProvider locale='en'>
          <SessionSummary session={data} />
        </I18nProvider>,
      );

    expect(render(session(null))).not.toContain('Finish');
    expect(render(session('2026-11-05T11:00:00.000Z'))).toContain('Finished');
  });
});
