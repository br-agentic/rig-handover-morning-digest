import type { Night } from '../digest/types.js';

export function Digest({ night, data }: { night: string; data: Night }) {
  return (
    <>
      <h1>digest · {night}</h1>
      {data.bad > 0 && <p class="mute">{data.bad} unreadable line{data.bad === 1 ? '' : 's'} skipped</p>}
      {data.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr><th>job</th><th>owner</th><th>runs</th><th>retries</th><th>last</th><th>last error</th><th>first</th><th>last time</th></tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr class={r.lastStatus === 'fail' || r.retries >= 3 ? 'warn' : ''}>
                <td>{r.job}</td>
                <td>{r.owner ?? '—'}</td>
                <td>{r.runs}</td>
                <td>{r.retries >= 3 ? `${r.retries} !` : r.retries}</td>
                <td>{r.lastStatus === 'fail' ? 'fail !' : r.lastStatus}</td>
                <td>{r.lastError ?? '—'}</td>
                <td>{r.first}</td>
                <td>{r.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
