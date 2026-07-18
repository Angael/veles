import { describe, expect, it, vi } from 'vitest';
import { createSequentialTaskQueue } from './createSequentialTaskQueue';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

describe('createSequentialTaskQueue', () => {
  it('does not start a newer save until the older save has settled', async () => {
    const first = deferred();
    const second = deferred();
    const task = vi
      .fn<(value: string) => Promise<void>>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const enqueue = createSequentialTaskQueue(task);

    const firstResult = enqueue('older');
    const secondResult = enqueue('newer');
    await Promise.resolve();
    expect(task).toHaveBeenCalledTimes(1);
    expect(task).toHaveBeenLastCalledWith('older');

    first.resolve();
    await firstResult;
    await Promise.resolve();
    expect(task).toHaveBeenCalledTimes(2);
    expect(task).toHaveBeenLastCalledWith('newer');

    second.resolve();
    await secondResult;
  });

  it('continues with the latest work after an earlier failure', async () => {
    const error = new Error('save failed');
    const first = deferred();
    const task = vi
      .fn<(value: string) => Promise<void>>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(undefined);
    const enqueue = createSequentialTaskQueue(task);

    const olderResult = enqueue('older');
    const newerResult = enqueue('newer');
    await Promise.resolve();
    expect(task).toHaveBeenCalledTimes(1);

    first.reject(error);
    await expect(olderResult).rejects.toBe(error);
    await expect(newerResult).resolves.toBeUndefined();
    expect(task).toHaveBeenCalledTimes(2);
  });
});
