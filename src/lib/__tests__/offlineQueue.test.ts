// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../practiceApi', () => ({ recordAttempt: vi.fn() }));

import { recordAttempt, type RecordAttemptInput } from '../practiceApi';
import { flushQueuedAttempts, isNetworkError, queuedAttemptCount, recordAttemptOrQueue } from '../offlineQueue';

const mockedRecordAttempt = vi.mocked(recordAttempt);

const input: RecordAttemptInput = {
  userId: 'u1',
  lessonId: 'l1',
  passScore: 70,
  result: { score: 90, svaraAccuracy: [], problemSvaras: [] },
  detectedSruthiHz: 146.83,
  durationSec: 12,
};

// Node 22+'s own experimental global `localStorage` shadows jsdom's and
// throws without a --localstorage-file CLI flag -- sidestep the conflict
// entirely with a plain in-memory Storage stand-in.
function makeMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => void store.set(k, v),
    removeItem: (k) => void store.delete(k),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeMemoryStorage());
  mockedRecordAttempt.mockReset();
  vi.stubGlobal('navigator', { onLine: true });
});

describe('isNetworkError', () => {
  it('treats TypeError (a failed fetch) as a network error', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('does not treat a Postgrest/RLS-style error as a network error', () => {
    expect(isNetworkError({ code: '42501', message: 'permission denied' })).toBe(false);
  });
});

describe('recordAttemptOrQueue', () => {
  it('does not queue when the write succeeds', async () => {
    mockedRecordAttempt.mockResolvedValueOnce({} as never);
    const { queued } = await recordAttemptOrQueue(input);
    expect(queued).toBe(false);
    expect(queuedAttemptCount()).toBe(0);
  });

  it('queues the attempt on a network failure instead of losing it', async () => {
    mockedRecordAttempt.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { queued } = await recordAttemptOrQueue(input);
    expect(queued).toBe(true);
    expect(queuedAttemptCount()).toBe(1);
  });

  it('rethrows a non-network error rather than silently queuing it', async () => {
    mockedRecordAttempt.mockRejectedValueOnce({ code: '23503', message: 'lesson not found' });
    await expect(recordAttemptOrQueue(input)).rejects.toMatchObject({ code: '23503' });
    expect(queuedAttemptCount()).toBe(0);
  });
});

describe('flushQueuedAttempts', () => {
  it('replays queued attempts and clears the queue on success', async () => {
    mockedRecordAttempt.mockRejectedValueOnce(new TypeError('offline'));
    await recordAttemptOrQueue(input);
    expect(queuedAttemptCount()).toBe(1);

    mockedRecordAttempt.mockResolvedValueOnce({} as never);
    const { synced, remaining } = await flushQueuedAttempts();
    expect(synced).toBe(1);
    expect(remaining).toBe(0);
    expect(queuedAttemptCount()).toBe(0);
  });

  it('leaves an item queued if it fails again with a network error', async () => {
    mockedRecordAttempt.mockRejectedValueOnce(new TypeError('offline'));
    await recordAttemptOrQueue(input);

    mockedRecordAttempt.mockRejectedValueOnce(new TypeError('still offline'));
    const { synced, remaining } = await flushQueuedAttempts();
    expect(synced).toBe(0);
    expect(remaining).toBe(1);
    expect(queuedAttemptCount()).toBe(1);
  });

  it('drops an item that fails with a non-network error, so it does not block the queue forever', async () => {
    mockedRecordAttempt.mockRejectedValueOnce(new TypeError('offline'));
    await recordAttemptOrQueue(input);

    mockedRecordAttempt.mockRejectedValueOnce({ code: '23503', message: 'lesson deleted' });
    const { synced, remaining } = await flushQueuedAttempts();
    expect(synced).toBe(0);
    expect(remaining).toBe(0);
    expect(queuedAttemptCount()).toBe(0);
  });
});
