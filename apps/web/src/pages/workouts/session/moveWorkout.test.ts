import { describe, expect, it } from 'vitest';
import { workoutMovePatch } from './moveWorkout';

const defaultName = (date: string) => `${date} workout`;

describe('workoutMovePatch', () => {
  it('moves the session to the picked day and keeps a custom name', () => {
    const patch = workoutMovePatch(
      { date: '2026-10-20', name: 'Leg day' },
      '2026-10-18',
      defaultName,
    );

    expect(patch).toEqual({ date: '2026-10-18' });
  });

  it('renames a default-named session after the new day', () => {
    const patch = workoutMovePatch(
      { date: '2026-10-20', name: '2026-10-20 workout' },
      '2026-10-21',
      defaultName,
    );

    expect(patch).toEqual({ date: '2026-10-21', name: '2026-10-21 workout' });
  });

  it('changes nothing when the picked day is the current day', () => {
    expect(
      workoutMovePatch({ date: '2026-10-20', name: 'Leg day' }, '2026-10-20', defaultName),
    ).toBeNull();
  });
});
