import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getStorageConfig, storagePathToUrl } from './config';

beforeEach(() => {
  vi.stubEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/veles_dev');
  vi.stubEnv('BETTER_AUTH_SECRET', 'abcdefghijklmnopqrstuvwxyz123456');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('storagePathToUrl', () => {
  it('joins public URL and object path with exactly one slash', () => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://cdn.example.com');
    expect(storagePathToUrl('/folder/file.png')).toBe('https://cdn.example.com/folder/file.png');

    vi.stubEnv('R2_PUBLIC_URL', 'https://cdn.example.com///');
    expect(storagePathToUrl('///folder/file.png')).toBe('https://cdn.example.com/folder/file.png');
  });

  it('returns null when either side of the URL is unavailable', () => {
    vi.stubEnv('R2_PUBLIC_URL', '');
    vi.stubEnv('VITE_CF_CDN_URL', '');
    expect(storagePathToUrl('folder/file.png')).toBeNull();

    vi.stubEnv('R2_PUBLIC_URL', 'https://cdn.example.com');
    expect(storagePathToUrl(null)).toBeNull();
    expect(storagePathToUrl(undefined)).toBeNull();
    expect(storagePathToUrl('')).toBeNull();
  });

  it('prefers an explicit R2 public URL over the CDN fallback', () => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://r2.example.com');
    vi.stubEnv('VITE_CF_CDN_URL', 'https://fallback.example.com');
    expect(getStorageConfig().publicUrl).toBe('https://r2.example.com');

    vi.stubEnv('R2_PUBLIC_URL', '');
    expect(getStorageConfig().publicUrl).toBe('https://fallback.example.com');
  });
});
