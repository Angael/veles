import css from './TanstackDbDemoPage.module.css';

const rows = [
  {
    question: 'What starts the first read?',
    rq: 'The loader calls ensureQueryData, or the first useQuery mounts.',
    db: 'The loader calls collection.preload(), or the first useLiveQuery subscribes. Only creating the collection does not fetch anything.',
  },
  {
    question: 'Where does the read come from?',
    rq: 'queryFn → server function → one cached value.',
    db: 'Same queryFn → server function. The answer is split into rows by getKey.',
  },
  {
    question: 'Where is the write code?',
    rq: 'One useXMutation hook per kind of write. Components call mutate().',
    db: 'One onInsert / onUpdate / onDelete per collection. Components call collection.update().',
  },
  {
    question: 'When does the UI change after a write?',
    rq: 'After the write and the refetch end (unless you add manual optimistic code).',
    db: 'In the same tick as the call. The server request starts right after.',
  },
  {
    question: 'When does fresh data come back?',
    rq: 'After invalidateQueries, on window focus when stale, or on the interval.',
    db: 'After every successful handler (automatic refetch, deprecated before v1.0), plus the same focus and interval rules.',
  },
  {
    question: 'How do I show "saving…"?',
    rq: 'mutation.isPending, per hook.',
    db: 'Usually you do not. If you must, the call returns a transaction with isPersisted.promise.',
  },
  {
    question: 'When is the data removed from memory?',
    rq: 'gcTime (5 min) after the last component stops using it.',
    db: 'Collection gcTime (5 min) after the last live query unmounts. The next use syncs again.',
  },
];

export function TimingSection() {
  return (
    <section className={css.section}>
      <h2>Where things come from, and when they start</h2>
      <p>
        This is the part that confuses people most. Read it row by row. The left column is what you
        already know.
      </p>
      <div className={css.tableScroller}>
        <table className={css.compare}>
          <thead>
            <tr>
              <th scope='col'>Question</th>
              <th scope='col'>React Query</th>
              <th scope='col'>React Query + TanStack DB</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.question}>
                <th scope='row'>{row.question}</th>
                <td>{row.rq}</td>
                <td>{row.db}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
