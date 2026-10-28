export type Status = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: Status;
  lastError: string | null;
  first: string;
  last: string;
};

export type Night = { rows: DigestRow[]; bad: number };

// Rows sorted by job; null when runs/<night>.jsonl does not exist.
export type ReadNight = (runsDir: string, night: string) => Night | null;
