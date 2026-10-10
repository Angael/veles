import { CodeSnippet } from './CodeSnippet';
import {
  dbCollectionSnippet,
  dbErrorSnippet,
  dbLiveQuerySnippet,
  dbMutateSnippet,
  dbRouteSnippet,
} from './demoSnippets';
import { FlowDiagram } from './FlowDiagram';
import css from './TanstackDbDemoPage.module.css';

export function TanstackDbSteps() {
  return (
    <>
      <section className={css.section}>
        <p className={css.stepTag}>Step 3</p>
        <h2>Same fetch, but now it fills a collection</h2>
        <p>
          A <strong>collection</strong> is a table in browser memory. Each row has an id. The
          collection is built <em>on top of</em> React Query: it still uses your{' '}
          <code>queryKey</code> and <code>queryFn</code>, polling, and focus refetch. The difference
          is what happens with the answer. React Query keeps it as one value. The collection splits
          it into rows, so it can change one row at a time.
        </p>
        <CodeSnippet code={dbCollectionSnippet} title='listItems.collection.ts (shortened)' />
        <CodeSnippet code={dbRouteSnippet} title='The route: no SSR, preload in the loader' />
      </section>

      <section className={css.section}>
        <p className={css.stepTag}>Step 4</p>
        <h2>Read with a live query</h2>
        <p>
          A <strong>live query</strong> is like a small SQL query that runs in the browser. You
          choose rows with <code>where</code>, sort them with <code>orderBy</code>, and can also
          join or group. It never calls the server. When a row changes, TanStack DB updates only the
          results that this row touches. It does not run the whole query again.
        </p>
        <CodeSnippet code={dbLiveQuerySnippet} title='Two components, one collection' />
        <p className={css.note}>
          Think of it like this: the collection is the table, a live query is a view on it. Many
          views can read the same table. If one row changes, every view shows it.
        </p>
      </section>

      <section className={css.section}>
        <p className={css.stepTag}>Step 5</p>
        <h2>Write to the collection, not to the server</h2>
        <p>
          Components call <code>insert</code>, <code>update</code>, or <code>delete</code> on the
          collection. They never call the server directly. The collection keeps two layers: the
          <strong> synced rows</strong> (last server answer) and an{' '}
          <strong>optimistic layer</strong> on top (your changes that the server has not confirmed
          yet). Live queries show both layers together.
        </p>
        <CodeSnippet code={dbMutateSnippet} title='CheckedNoteItem after PR #227' />
        <h3>What happens after you call update()</h3>
        <FlowDiagram
          label='TanStack DB write timeline, success'
          steps={[
            { detail: 'same tick', label: 'update()', tone: 'ui' },
            { detail: 'every live query re-renders', label: 'Optimistic layer', tone: 'client' },
            { detail: 'your server function', label: 'onUpdate handler', tone: 'server' },
            { detail: 'automatic', label: 'Refetch', tone: 'server' },
            { detail: 'optimistic layer removed', label: 'Synced rows = truth', tone: 'client' },
          ]}
        />
        <FlowDiagram
          label='TanStack DB write timeline, failure'
          steps={[
            { detail: 'same tick', label: 'update()', tone: 'ui' },
            { label: 'Optimistic layer', tone: 'client' },
            { detail: 'throws', label: 'onUpdate handler', tone: 'error' },
            { detail: 'old value is back', label: 'Rollback', tone: 'error' },
          ]}
        />
        <CodeSnippet code={dbErrorSnippet} title='Errors: toast, then rethrow' />
        <p className={css.note}>
          A background refetch during a pending write does not overwrite your change. The optimistic
          layer stays on top until its handler finishes.
        </p>
      </section>
    </>
  );
}
