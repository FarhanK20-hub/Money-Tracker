/**
 * gist-sync.ts
 * Local-First GitHub Gist sync.
 * - All UI reads from localStorage (instant, no latency)
 * - After every write, syncToGist() is called in the background (fire-and-forget)
 * - On app open, syncFromGist() pulls remote data and merges with local
 */

const GIST_TOKEN = process.env.NEXT_PUBLIC_GIST_TOKEN || '';
const GIST_ID = process.env.NEXT_PUBLIC_GIST_ID || '';
const GIST_FILENAME = 'money-tracker-data.json';
const GIST_API = `https://api.github.com/gists/${GIST_ID}`;

const DATE_KEYS = new Set([
  'timestamp', 'createdAt', 'reviewedAt', 'startDate', 'maturityDate',
]);

function reviveDates(_key: string, value: unknown): unknown {
  if (DATE_KEYS.has(_key) && typeof value === 'string') {
    return new Date(value);
  }
  return value;
}

interface GistPayload {
  transactions: unknown[];
  fixedDeposits: unknown[];
  fdTransactions: unknown[];
  lastUpdated: string;
}

function readLocalRaw(key: string): unknown[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalRaw(key: string, data: unknown[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function mergeById<T extends { id: string; createdAt: unknown }>(
  local: T[],
  remote: T[],
): { merged: T[]; changed: boolean } {
  const map = new Map<string, T>();
  let changed = false;

  for (const item of local) map.set(item.id, item);
  
  for (const item of remote) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      changed = true;
    } else {
      const existingTime = existing.createdAt instanceof Date
        ? existing.createdAt.getTime()
        : new Date(existing.createdAt as string || 0).getTime();
      const remoteTime = item.createdAt instanceof Date
        ? item.createdAt.getTime()
        : new Date(item.createdAt as string || 0).getTime();
        
      if (remoteTime > existingTime) {
        map.set(item.id, item);
        changed = true;
      }
    }
  }
  
  if (map.size !== local.length) {
    changed = true;
  }
  
  return { merged: Array.from(map.values()), changed };
}

export async function syncToGist(): Promise<void> {
  if (!GIST_TOKEN || !GIST_ID) return;
  try {
    const payload: GistPayload = {
      transactions: readLocalRaw('transactions'),
      fixedDeposits: readLocalRaw('fixedDeposits'),
      fdTransactions: readLocalRaw('fdTransactions'),
      lastUpdated: new Date().toISOString(),
    };
    await fetch(GIST_API, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: { content: JSON.stringify(payload) },
        },
      }),
    });
  } catch {
    // Silently ignore — offline or rate-limited
  }
}

export async function syncFromGist(): Promise<boolean> {
  if (!GIST_TOKEN || !GIST_ID) return false;
  try {
    const res = await fetch(GIST_API, {
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) return false;

    const gistData = await res.json();
    const fileContent: string = gistData?.files?.[GIST_FILENAME]?.content;
    if (!fileContent) return false;

    const remote: GistPayload = JSON.parse(fileContent, reviveDates as (key: string, value: unknown) => unknown);

    const collections = [
      { key: 'transactions', remote: remote.transactions || [] },
      { key: 'fixedDeposits', remote: remote.fixedDeposits || [] },
      { key: 'fdTransactions', remote: remote.fdTransactions || [] },
    ];

    let anyChanged = false;
    for (const { key, remote: remoteItems } of collections) {
      if (remoteItems.length === 0) continue;
      const local = readLocalRaw(key) as Array<{ id: string; createdAt: unknown }>;
      const { merged, changed } = mergeById(local, remoteItems as Array<{ id: string; createdAt: unknown }>);
      if (changed) {
        writeLocalRaw(key, merged);
        anyChanged = true;
      }
    }

    return anyChanged;
  } catch {
    return false;
  }
}
