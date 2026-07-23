import { describe, expect, it } from 'vitest';
import { getSafeRedirectPath } from './getSafeRedirectPath';

describe('getSafeRedirectPath', () => {
  it('keeps local callback paths', () => {
    expect(getSafeRedirectPath('/diary?created=1')).toBe('/diary?created=1');
  });

  it.each([undefined, 'https://evil.example', '//evil.example', '/\\evil.example'])(
    'rejects %j',
    (value) => {
      expect(getSafeRedirectPath(value)).toBe('/');
    },
  );
});
