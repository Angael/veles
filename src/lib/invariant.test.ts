import { describe, expect, it, vi } from 'vitest';
import { invariant } from './invariant';

describe('invariant', () => {
  it.each([false, 0, '', Number.NaN])('accepts non-nullish value %j', (value) => {
    expect(() => invariant(value, 'unexpected')).not.toThrow();
  });

  it.each([null, undefined])('throws the supplied message for %s', (value) => {
    expect(() => invariant(value, 'missing')).toThrow('missing');
  });

  it('delegates violations to the supplied callback', () => {
    const expected = new RangeError('outside range');
    const onViolation = vi.fn(() => {
      throw expected;
    });

    expect(() => invariant(null, onViolation)).toThrow(expected);
    expect(onViolation).toHaveBeenCalledOnce();
  });
});
