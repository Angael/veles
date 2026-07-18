import { describe, expect, it } from 'vitest';
import { takeGraphemes } from './takeGraphemes';

describe('takeGraphemes', () => {
  it.each([
    ['abc', 2, 'ab'],
    ['😀b', 1, '😀'],
    ['e\u0301clair', 1, 'e\u0301'],
    ['👨‍👩‍👧‍👦 family', 1, '👨‍👩‍👧‍👦'],
    ['abc', 0, ''],
    ['abc', -1, ''],
    ['abc', Number.NaN, ''],
    ['abc', Number.POSITIVE_INFINITY, ''],
  ])('takes complete graphemes from %j at boundary %s', (value, maximum, expected) => {
    expect(takeGraphemes(value, maximum)).toBe(expected);
    expect(takeGraphemes(value, maximum)).not.toContain('\uFFFD');
  });
});
