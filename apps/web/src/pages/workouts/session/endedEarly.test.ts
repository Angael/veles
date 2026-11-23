import { describe, expect, it } from 'vitest';
import type { SetMetrics } from '../metrics';
import { skippedSlotIds } from './endedEarly';

const empty: SetMetrics & { done: boolean } = {
  distanceKm: null,
  done: false,
  durationSeconds: null,
  reps: null,
  weightKg: null,
};
const slot = (id: string, ...sets: (typeof empty)[]) => ({ id, sets });

describe('skippedSlotIds', () => {
  it('skips nothing when no exercise is touched', () => {
    expect(skippedSlotIds([slot('a', empty), slot('b', empty)])).toEqual([]);
  });

  it('skips the slots after the last touched one', () => {
    const slots = [
      slot('a', empty),
      slot('b', { ...empty, done: true }),
      slot('c', empty),
      slot('d'),
    ];
    expect(skippedSlotIds(slots)).toEqual(['c', 'd']);
  });

  it('counts a value without a tick as touched', () => {
    expect(skippedSlotIds([slot('a', { ...empty, reps: 5 }), slot('b', empty)])).toEqual(['b']);
  });

  it('skips nothing when the last slot is touched', () => {
    expect(skippedSlotIds([slot('a', empty), slot('b', { ...empty, done: true })])).toEqual([]);
  });
});
