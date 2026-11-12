import { MutationObserver, QueryObserver } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '@/lib/queryClient';
import { finishWorkout } from './finishWorkout';

vi.mock('@/components/ui/toast/toastManager', () => ({ toastManager: { add: vi.fn() } }));

type Variables = { finished: true; id: string };

/**
 * The live page in miniature: the app query client, the open session watched like the route does,
 * and a Finish observer that "unmounts" as soon as the refetch shows the workout ended, the way
 * `WorkoutActions` drops `FinishWorkoutButton`.
 */
function setup({ fail = false } = {}) {
  const events: string[] = [];
  const server = { endedAt: null as string | null };
  const client = createQueryClient();
  const readSession = () => Promise.resolve({ endedAt: server.endedAt });

  const session = new QueryObserver(client, {
    queryFn: readSession,
    queryKey: ['workouts', 'session', 'w1'],
  });
  const finishButton = new MutationObserver<unknown, Error, Variables>(client, {
    meta: { invalidateQueryKey: ['workouts'] },
    mutationFn: () => {
      if (fail) return Promise.reject(new Error('offline'));
      server.endedAt = '2026-11-05T11:00:00.000Z';
      return Promise.resolve(null);
    },
  });
  const unmountButton = finishButton.subscribe(() => {});
  session.subscribe((result) => {
    if (result.data?.endedAt) {
      events.push('unmount');
      unmountButton();
    }
  });

  const finish = (variables: Variables) => finishButton.mutate(variables);
  return { events, finish, finishButton, ready: session.refetch() };
}

describe('finishWorkout', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loses per-call mutate callbacks when the refetch unmounts the button first', async () => {
    const { events, finishButton, ready } = setup();
    await ready;
    const onSuccess = vi.fn();

    await finishButton.mutate({ finished: true, id: 'w1' }, { onSuccess });

    expect(events).toEqual(['unmount']);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('clears the rest timer and leaves even after the button unmounted', async () => {
    const removeItem = vi.fn(() => events.push('clear timer'));
    vi.stubGlobal('localStorage', { removeItem });
    const { events, finish, ready } = setup();
    await ready;

    await finishWorkout('w1', {
      finish,
      leave: () => events.push('leave'),
    });

    expect(events).toEqual(['unmount', 'clear timer', 'leave']);
    expect(removeItem).toHaveBeenCalledWith('veles.workouts.rest');
  });

  it('still leaves when storage is blocked', async () => {
    vi.stubGlobal('localStorage', {
      removeItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    });
    const { finish, ready } = setup();
    await ready;
    const leave = vi.fn();

    await finishWorkout('w1', { finish, leave });

    expect(leave).toHaveBeenCalledOnce();
  });

  it('stays on the workout and keeps the timer when saving fails', async () => {
    const removeItem = vi.fn();
    vi.stubGlobal('localStorage', { removeItem });
    const { finish, ready } = setup({ fail: true });
    await ready;
    const leave = vi.fn();

    await finishWorkout('w1', { finish, leave });

    expect(leave).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });
});
