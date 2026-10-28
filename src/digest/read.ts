import { readFileSync } from 'node:fs';
import type { DigestRow, ReadNight, Status } from './types.js';

const statuses: readonly string[] = ['ok', 'retry', 'fail'];

// Parse one line at the edge; anything off-shape is a bad line, never a throw.
function parse(line: string) {
  try {
    const o: unknown = JSON.parse(line);
    if (typeof o !== 'object' || o === null) return null;
    const { at, job, status, owner, error } = o as Record<string, unknown>;
    if (typeof at !== 'string' || typeof job !== 'string' || typeof status !== 'string' || !statuses.includes(status)) return null;
    return {
      at,
      job,
      status: status as Status,
      owner: typeof owner === 'string' ? owner : null,
      error: typeof error === 'string' ? error : null,
    };
  } catch {
    return null;
  }
}

export const readNight: ReadNight = (runsDir, night) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return null; // route param: no path tricks
  let text: string;
  try {
    text = readFileSync(`${runsDir}/${night}.jsonl`, 'utf8');
  } catch {
    return null;
  }
  const rows = new Map<string, DigestRow>();
  let bad = 0;
  const counts = { ok: 0, retry: 0, fail: 0 };
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const e = parse(line);
    if (!e) {
      bad++;
      continue;
    }
    const row = rows.get(e.job) ?? { job: e.job, owner: null, runs: 0, retries: 0, lastStatus: e.status, lastError: null, first: e.at, last: e.at };
    counts[e.status]++;
    row.runs++;
    if (e.status === 'retry') row.retries++;
    row.lastStatus = e.status;
    row.last = e.at;
    row.owner = e.owner ?? row.owner;
    row.lastError = e.error ?? row.lastError;
    rows.set(e.job, row);
  }
  return { rows: [...rows.values()].sort((a, b) => (a.job < b.job ? -1 : a.job > b.job ? 1 : 0)), bad, counts };
};
