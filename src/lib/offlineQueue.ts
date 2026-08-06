import { recordAttempt, type RecordAttemptInput } from './practiceApi';

// Practice works offline (the engine + scoring are entirely client-side);
// only the final attempt write needs the network. When it fails, queue the
// payload in localStorage and replay it on reconnect (build plan §9 Phase 6:
// "practice works offline, attempts sync on reconnect via queued inserts").
const QUEUE_KEY = 'sruthiscribe-learn:offline-attempt-queue';

interface QueuedAttempt {
  id: string;
  input: RecordAttemptInput;
  queuedAt: string;
}

function readQueue(): QueuedAttempt[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedAttempt[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedAttempt[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function queueAttempt(input: RecordAttemptInput): void {
  const items = readQueue();
  items.push({ id: crypto.randomUUID(), input, queuedAt: new Date().toISOString() });
  writeQueue(items);
}

export function queuedAttemptCount(): number {
  return readQueue().length;
}

// A failed fetch (offline, DNS, connection refused) throws a plain
// TypeError in browsers -- distinct from a Supabase/Postgrest error object,
// which always has a `code`/`message` shape. Only network failures should
// queue; a real RLS/validation rejection should still surface as an error.
export function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError || (!navigator.onLine);
}

export async function recordAttemptOrQueue(input: RecordAttemptInput): Promise<{ queued: boolean }> {
  try {
    await recordAttempt(input);
    return { queued: false };
  } catch (e) {
    if (isNetworkError(e)) {
      queueAttempt(input);
      return { queued: true };
    }
    throw e;
  }
}

export async function flushQueuedAttempts(): Promise<{ synced: number; remaining: number }> {
  const items = readQueue();
  if (items.length === 0) return { synced: 0, remaining: 0 };
  const stillQueued: QueuedAttempt[] = [];
  let synced = 0;
  for (const item of items) {
    try {
      await recordAttempt(item.input);
      synced++;
    } catch (e) {
      if (isNetworkError(e)) stillQueued.push(item);
      // a non-network error (e.g. the lesson was deleted) drops the item --
      // retrying forever wouldn't help, and we don't want to block the rest
      // of the queue on one bad entry.
    }
  }
  writeQueue(stillQueued);
  return { synced, remaining: stillQueued.length };
}
