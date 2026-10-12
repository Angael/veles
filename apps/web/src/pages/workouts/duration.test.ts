import { describe, expect, it } from 'vitest';
import { completedSetDuration, elapsedSeconds, workoutDuration } from './duration';

const start = '2026-10-12T10:00:00.000Z';
const finish = '2026-10-12T10:00:10.000Z';

const loggedSlots = [
  {
    sets: [
      { done: true, durationSeconds: 600 },
      { done: true, durationSeconds: 300 },
    ],
  },
  {
    sets: [
      { done: true, durationSeconds: 1200 },
      { done: false, durationSeconds: 3600 },
    ],
  },
  {
    sets: [
      { done: true, durationSeconds: null },
      { done: true, durationSeconds: 0 },
    ],
  },
];

describe('workout duration', () => {
  it('floors a retrospectively logged session at the total of all completed timed sets', () => {
    expect(workoutDuration(elapsedSeconds(start, finish), completedSetDuration(loggedSlots))).toBe(
      2100,
    );
  });

  it('does not count planned or copied unfinished sets, or invent time for reps-only sets', () => {
    expect(completedSetDuration(loggedSlots)).toBe(2100);
    expect(
      completedSetDuration([
        {
          sets: [
            { done: false, durationSeconds: 3600 },
            { done: true, durationSeconds: null },
          ],
        },
      ]),
    ).toBe(0);
  });

  it('preserves longer elapsed sessions, including rest time', () => {
    expect(workoutDuration(3600, completedSetDuration(loggedSlots))).toBe(3600);
  });

  it('keeps sessions without timed sets unchanged', () => {
    expect(workoutDuration(10, 0)).toBe(10);
    expect(workoutDuration(0, completedSetDuration([]))).toBe(0);
    expect(workoutDuration(null, 0)).toBeNull();
  });

  it('uses logged exercise time even if old data has no start timestamp', () => {
    expect(workoutDuration(elapsedSeconds(null, finish), 600)).toBe(600);
  });

  it('counts completed sets regardless of exercise tracking type', () => {
    // Tracking types can change without discarding existing duration metrics.
    expect(completedSetDuration([{ sets: [{ done: true, durationSeconds: 60 }] }])).toBe(60);
  });

  it('recomputes the floor when finished-session sets are edited, unticked or removed', () => {
    const slots = structuredClone(loggedSlots);
    const set = slots[0]?.sets[0];
    if (!set) throw new Error('Missing test set.');
    set.durationSeconds = 1200;
    expect(workoutDuration(10, completedSetDuration(slots))).toBe(2700);
    set.done = false;
    expect(workoutDuration(10, completedSetDuration(slots))).toBe(1500);
    slots.splice(1, 1);
    expect(workoutDuration(10, completedSetDuration(slots))).toBe(300);
  });

  it('returns the same result from reloaded persisted inputs', () => {
    const reloaded = structuredClone({ start, finish, slots: loggedSlots });
    expect(
      workoutDuration(
        elapsedSeconds(reloaded.start, reloaded.finish),
        completedSetDuration(reloaded.slots),
      ),
    ).toBe(2100);
  });

  it('keeps elapsed timestamps independent of the exercise-duration floor', () => {
    expect(elapsedSeconds(start, finish)).toBe(10);
    expect(elapsedSeconds(finish, start)).toBe(0);
    expect(elapsedSeconds(start, null)).toBeNull();
  });
});
