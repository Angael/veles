import { describe, expect, it } from 'vitest';
import { isVersionConflictError, VersionConflictError } from './VersionConflictError';

describe('isVersionConflictError', () => {
  it('matches the server error and its serialized browser copy', () => {
    const browserCopy = Object.assign(new Error('Changed'), { name: 'VersionConflictError' });

    expect(isVersionConflictError(new VersionConflictError('Changed'))).toBe(true);
    expect(isVersionConflictError(browserCopy)).toBe(true);
    expect(isVersionConflictError(new Error('Network'))).toBe(false);
    expect(isVersionConflictError('VersionConflictError')).toBe(false);
  });
});
