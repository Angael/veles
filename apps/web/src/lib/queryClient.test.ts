import { describe, expect, it, vi } from 'vitest';

const add = vi.hoisted(() => vi.fn());
vi.mock('@/components/ui/toast/toastManager', () => ({ toastManager: { add } }));

import { createQueryClient } from './queryClient';

describe('mutation meta toasts', () => {
  it('shows a high-priority error toast only when the mutation declares one', async () => {
    const client = createQueryClient();
    const fail = () => Promise.reject(new Error('nope'));

    await client
      .getMutationCache()
      .build(client, { mutationFn: fail })
      .execute(undefined)
      .catch(() => {});
    expect(add).not.toHaveBeenCalled();

    await client
      .getMutationCache()
      .build(client, { meta: { error: { title: 'Could not save' } }, mutationFn: fail })
      .execute(undefined)
      .catch(() => {});
    expect(add).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ priority: 'high', title: 'Could not save', type: 'error' }),
    );
  });

  it('stays silent on success unless the mutation asks for confirmation', async () => {
    add.mockClear();
    const client = createQueryClient();
    const succeed = () => Promise.resolve('ok');

    await client.getMutationCache().build(client, { mutationFn: succeed }).execute(undefined);
    expect(add).not.toHaveBeenCalled();

    await client
      .getMutationCache()
      .build(client, { meta: { success: { title: 'Saved as a routine' } }, mutationFn: succeed })
      .execute(undefined);
    expect(add).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ title: 'Saved as a routine', type: 'success' }),
    );
  });
});
