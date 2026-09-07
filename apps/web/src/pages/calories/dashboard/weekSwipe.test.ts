import { describe, expect, it } from 'vitest';
import { weekSwipeDirection } from './weekSwipe';

describe('weekSwipeDirection', () => {
  it('moves to the next week after a left swipe', () => {
    expect(weekSwipeDirection({ x: 260, y: 100 }, { x: 150, y: 104 })).toBe(1);
  });

  it('moves to the previous week after a right swipe', () => {
    expect(weekSwipeDirection({ x: 120, y: 100 }, { x: 210, y: 96 })).toBe(-1);
  });

  it('ignores short or predominantly vertical movements', () => {
    expect(weekSwipeDirection({ x: 200, y: 100 }, { x: 150, y: 102 })).toBeNull();
    expect(weekSwipeDirection({ x: 200, y: 100 }, { x: 290, y: 240 })).toBeNull();
  });
});
