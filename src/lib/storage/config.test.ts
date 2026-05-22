import { describe, expect, it, vi } from 'vitest'

describe('storagePathToUrl', () => {
  it('joins public url and object path', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/veles_dev')
    vi.stubEnv('BETTER_AUTH_SECRET', 'abcdefghijklmnopqrstuvwxyz123456')
    vi.stubEnv('R2_PUBLIC_URL', 'https://cdn.example.com')

    const { storagePathToUrl } = await import('./config')

    expect(storagePathToUrl('/folder/file.png')).toBe('https://cdn.example.com/folder/file.png')
  })
})
