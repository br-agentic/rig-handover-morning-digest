import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const dir = mkdtempSync(join(tmpdir(), 'runs-'));
writeFileSync(join(dir, '2026-01-01.jsonl'), '');
writeFileSync(
  join(dir, '2026-01-02.jsonl'),
  '{"at":"2026-01-02T01:00:00+01:00","job":"b","status":"fail","owner":null,"error":"boom"}\nnot json\n{"at":"2026-01-02T02:00:00+01:00","job":"a","status":"ok","owner":"x"}\n',
);
const app = createApp({ adapter: 'shim', installed: 'x', beatEverySeconds: 60, runsDir: dir });

describe('digest routes', () => {
  it('page and JSON agree on jobs and order', async () => {
    const page = await app.request('/digest/2026-01-02');
    const json = (await (await app.request('/api/digest/2026-01-02')).json()) as { rows: { job: string }[]; bad: number };
    const html = await page.text();
    expect(page.status).toBe(200);
    expect(json.rows.map((r) => r.job)).toEqual(['a', 'b']);
    expect(html.indexOf('<td>a</td>')).toBeLessThan(html.indexOf('<td>b</td>'));
    expect(json.bad).toBe(1);
    expect(html).toContain('1 unreadable line skipped');
    expect(html).toContain('fail !');
  });

  it('shows — for a null owner', async () => {
    expect(await (await app.request('/digest/2026-01-02')).text()).toContain('<td>—</td>');
  });

  it('empty night renders "nothing ran" and an empty list', async () => {
    expect(await (await app.request('/digest/2026-01-01')).text()).toContain('nothing ran');
    expect(((await (await app.request('/api/digest/2026-01-01')).json()) as { rows: unknown[] }).rows).toEqual([]);
  });

  it('404 for a night with no file or a bad name', async () => {
    for (const p of ['/digest/1999-01-01', '/api/digest/1999-01-01', '/digest/..%2Frig']) {
      expect((await app.request(p)).status).toBe(404);
    }
  });

  it('board links each night with counts', async () => {
    const html = await (await app.request('/')).text();
    expect(html).toContain('href="/digest/2026-01-02"');
    expect(html).toContain('ok 1 · retry 0 · fail 1');
  });
});
