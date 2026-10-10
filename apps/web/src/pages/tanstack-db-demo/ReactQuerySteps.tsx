import { CodeSnippet } from './CodeSnippet';
import { rqFetchSnippet, rqMutateSnippet, rqOptimisticSnippet } from './demoSnippets';
import { FlowDiagram } from './FlowDiagram';
import css from './TanstackDbDemoPage.module.css';

export function ReactQuerySteps() {
  return (
    <>
      <section className={css.section}>
        <p className={css.stepTag}>Step 1</p>
        <h2>Fetch with React Query</h2>
        <p>
          React Query is a <strong>cache of server answers</strong>. You give it a key and a
          function. It calls the function, keeps the answer under that key, and gives the same
          answer to every component that asks for that key.
        </p>
        <CodeSnippet code={rqFetchSnippet} title='Reading list items with React Query' />
        <dl className={css.facts}>
          <div>
            <dt>Where does the data live?</dt>
            <dd>
              In the <code>QueryClient</code> cache, under <code>['list-items']</code>. The answer
              is one value. React Query does not know what is inside it.
            </dd>
          </div>
          <div>
            <dt>When does the request start?</dt>
            <dd>
              When the route loader calls <code>ensureQueryData</code>, or when the first component
              with <code>useQuery</code> mounts. It runs again when the data is stale and the window
              gets focus, on the interval, or after <code>invalidateQueries</code>.
            </dd>
          </div>
          <div>
            <dt>Does it work with SSR?</dt>
            <dd>
              Yes. The loader runs on the server and the cache goes to the browser with the HTML.
            </dd>
          </div>
        </dl>
      </section>

      <section className={css.section}>
        <p className={css.stepTag}>Step 2</p>
        <h2>Mutate with React Query</h2>
        <p>
          A mutation is a function that changes data on the server. React Query only runs it and
          tells you if it is pending. <strong>It does not change the cache for you.</strong> The
          usual way is: send the write, then invalidate the key so the list loads again.
        </p>
        <CodeSnippet code={rqMutateSnippet} title='A checkbox with useMutation + invalidate' />
        <FlowDiagram
          label='React Query write timeline'
          steps={[
            { label: 'Click', tone: 'ui' },
            { detail: 'wait 1 round trip', label: 'PATCH', tone: 'server' },
            { detail: 'mark key stale', label: 'Invalidate', tone: 'client' },
            { detail: 'wait 1 more round trip', label: 'GET', tone: 'server' },
            { detail: 'checkbox finally moves', label: 'UI updates', tone: 'ui' },
          ]}
        />
        <p>
          On a slow phone that is two round trips before the checkbox moves. To fix it, you copy the
          server value into local state and undo it by hand when the request fails:
        </p>
        <CodeSnippet
          code={rqOptimisticSnippet}
          title='Manual optimistic update (the old Veles code)'
        />
        <ul className={css.pains}>
          <li>Every write needs its own copy, effect, and undo code.</li>
          <li>
            The copy lives in one component. Other places that show the same row (search, counts)
            still show the old value.
          </li>
          <li>
            The "proper" fix is <code>onMutate</code> + <code>setQueryData</code>. Then you must
            know the exact shape of every cached answer that holds this row, and patch each one.
          </li>
        </ul>
      </section>
    </>
  );
}
