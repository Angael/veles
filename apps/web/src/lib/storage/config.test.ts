import { describe, expect, it, vi } from 'vitest';

describe('storagePathToUrl', () => {
  it('joins public url and object path', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/veles_dev');
    vi.stubEnv('BETTER_AUTH_SECRET', 'secret');
    vi.stubEnv('APP_URL', 'http://localhost:3000');
    vi.stubEnv('AUTH_ALLOWED_EMAILS', '');
    vi.stubEnv('GOOGLE_CLIENT_ID', '');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('VITE_CF_CDN_URL', 'https://cdn.example.com');
    vi.stubEnv('R2_ACCOUNT_ID', 'account-id');
    vi.stubEnv('R2_ACCESS_KEY_ID', 'access-key-id');
    vi.stubEnv('R2_SECRET_ACCESS_KEY', 'secret-access-key');
    vi.stubEnv('R2_BUCKET_NAME', 'bucket-name');

    const { storagePathToUrl } = await import('./config');

    expect(storagePathToUrl('/folder/file.png')).toBe('https://cdn.example.com/folder/file.png');
  });
});
