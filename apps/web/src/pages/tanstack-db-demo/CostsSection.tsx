import { CodeSnippet } from './CodeSnippet';
import { dbSideEffectSnippet } from './demoSnippets';
import css from './TanstackDbDemoPage.module.css';

const constraints = [
  {
    title: 'No SSR',
    text: 'Collections exist only in the browser. The route needs ssr: false. A hard reload shows the pending screen for a moment, because the server sends no data with the HTML.',
  },
  {
    title: 'Flat rows only',
    text: 'The server must return rows like a database table, not nested objects. In Veles, getNotes stopped nesting items, and a new getListItems returns them flat. You join or group them in live queries.',
  },
  {
    title: 'Client makes the ids',
    text: 'The row must exist before the server answers, so the client calls crypto.randomUUID(). The create server function must accept that id.',
  },
  {
    title: 'One collection per QueryClient',
    text: 'Do not create it at module scope or in render. Use the WeakMap getter, so the loader, hooks, and mutations share one instance.',
  },
  {
    title: 'Server side effects are your job',
    text: 'If a normal mutation changes the rows on the server (delete a note → its items go too), the collection does not know. Call collection.utils.refetch() in onSuccess.',
  },
  {
    title: 'Handlers must throw',
    text: 'Rollback only happens when the handler throws. If you catch the error and do not rethrow, the wrong value stays on screen until the next refetch.',
  },
  {
    title: 'Extra GET after each write',
    text: 'Today, after each successful handler the whole collection refetches. This auto refetch is deprecated and goes away in v1.0. Then each handler must call await collection.utils.refetch() itself, or return { refetch: false } to skip it.',
  },
  {
    title: 'Split the loader',
    text: "Route loaders are not code-split by default. If the loader imports a collection, TanStack DB goes into the main bundle. Use codeSplitGroupings: [['loader'], ['component']] on the route.",
  },
  {
    title: 'Pre-1.0',
    text: 'Veles uses @tanstack/react-db 0.5.4 and @tanstack/db 0.12.0. Minor versions can change the API. Read the guides shipped in node_modules, not old blog posts.',
  },
];

// Measured with `vite build` on this branch and its merge base, gzip, JS only.
const bundleGroups = [
  {
    title: 'JS every page loads at startup',
    max: 280,
    bars: [
      { kb: 210.0, label: 'Before PR #227' },
      { kb: 273.3, label: 'PR #227, loader not split', warn: true },
      { kb: 210.4, label: 'PR #227 + codeSplitGroupings' },
    ],
  },
  {
    title: 'Extra JS when you first open Notes',
    max: 160,
    bars: [
      { kb: 58.8, label: 'Before PR #227' },
      { kb: 156.6, label: 'With TanStack DB' },
    ],
  },
];

export function CostsSection() {
  return (
    <>
      <section className={css.section}>
        <h2>What it costs: constraints</h2>
        <div className={css.cards}>
          {constraints.map((constraint) => (
            <article className={css.constraint} key={constraint.title}>
              <h3>{constraint.title}</h3>
              <p>{constraint.text}</p>
            </article>
          ))}
        </div>
        <CodeSnippet code={dbSideEffectSnippet} title='When React Query and the collection meet' />
      </section>

      <section className={css.section}>
        <h2>What it costs: bundle size</h2>
        <p>
          TanStack DB adds about <strong>97 kB gzip</strong>: about 60 kB for the core and the query
          collection, and about 36 kB for the React live query code. Most of it is the query engine,
          which updates results row by row instead of running the query again.
        </p>
        {bundleGroups.map((group) => (
          <figure className={css.bars} key={group.title}>
            <figcaption>{group.title}</figcaption>
            {group.bars.map((bar) => (
              <div className={css.bar} data-warn={bar.warn || undefined} key={bar.label}>
                <span>{bar.label}</span>
                <div className={css.barTrack}>
                  <div
                    className={css.barFill}
                    style={{ inlineSize: `${(bar.kb / group.max) * 100}%` }}
                  />
                </div>
                <strong>{bar.kb.toFixed(0)} kB</strong>
              </div>
            ))}
          </figure>
        ))}
        <p className={css.note}>
          Watch the loader. TanStack Router splits the route <code>component</code> into a lazy
          chunk, but the <code>loader</code> stays in the main bundle. A loader that imports a
          collection pulls TanStack DB into every page. Add{' '}
          <code>codeSplitGroupings: [[&apos;loader&apos;], [&apos;component&apos;]]</code> to the
          route, and the library loads only when you open that route. Later routes reuse the same
          chunks, so you pay this cost once.
        </p>
      </section>

      <section className={css.section}>
        <h2>Where it fits, and where it does not</h2>
        <div className={css.fit}>
          <div data-fit='yes'>
            <h3>Use TanStack DB for</h3>
            <ul>
              <li>Small rows that you edit often: checkboxes, quick add, rename, reorder.</li>
              <li>The same rows shown in many places (list + search + counter).</li>
              <li>Edits that should work on a bad network, like logging a gym set.</li>
              <li>Fewer than about 10 000 rows (the default mode loads all rows at once).</li>
            </ul>
          </div>
          <div data-fit='no'>
            <h3>Keep plain React Query for</h3>
            <ul>
              <li>Pages that must render on the server (SSR).</li>
              <li>Read-mostly pages, where nothing needs to feel instant.</li>
              <li>Totals that the server computes, like weekly calorie sums.</li>
              <li>File uploads and long jobs, where you must wait for the server anyway.</li>
              <li>
                Real-time sync between users. Polling works; true live sync needs ElectricSQL or
                similar.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
