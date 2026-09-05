import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./session.api', () => ({
  getSessionUser: vi.fn(),
}));

import { getSessionUser } from './session.api';
import { sessionUserQueryOptions } from './session.query';

describe('session user query', () => {
  it('reuses a fresh session result across route checks', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.test',
      image: null,
      name: 'Test User',
    });

    const queryClient = new QueryClient();

    await queryClient.fetchQuery(sessionUserQueryOptions());
    await queryClient.fetchQuery(sessionUserQueryOptions());

    expect(getSessionUser).toHaveBeenCalledOnce();
  });
});
