import { CostsSection } from './CostsSection';
import { FlowDiagram } from './FlowDiagram';
import { Playground } from './Playground';
import { ReactQuerySteps } from './ReactQuerySteps';
import { TanstackDbSteps } from './TanstackDbSteps';
import { TimingSection } from './TimingSection';
import css from './TanstackDbDemoPage.module.css';

const prChanges = [
  'listItems.collection.ts is new. It owns the read (getListItems) and the three write handlers.',
  'CheckedNoteCard reads items with useLiveQuery instead of note.items.',
  'Four useXListItemMutation hooks and their invalidation keys are gone.',
  'getNotes no longer nests items. getListItems returns flat rows.',
  'createListItem accepts a client id, so a new row can get focus at once.',
  'The /todos route has ssr: false and preloads the collection in the loader.',
];

const cheatSheet = [
  ['React Query', 'a cache of server answers, one value per key'],
  ['Collection', 'a table of rows in the browser, filled by a queryFn'],
  ['Live query', 'a view on one or more collections; no network'],
  ['insert / update / delete', 'change the UI now, then call your handler'],
  ['Handler throws', 'the change rolls back'],
  ['Handler succeeds', 'the collection refetches; server data wins'],
] as const;

export function TanstackDbDemoPage() {
  return (
    <main className={css.page}>
      <header className={css.hero}>
        <h1>TanStack DB, step by step</h1>
        <p>
          You already know React Query. This page shows what TanStack DB adds on top of it, what it
          costs, and when to skip it. It follows the real change in Veles PR #227 (shopping list
          items). The playground runs against a fake server in your browser, so you can break things
          safely.
        </p>
      </header>

      <section className={css.section}>
        <h2>The idea in one picture</h2>
        <div className={css.models}>
          <div>
            <h3>React Query</h3>
            <FlowDiagram
              label='React Query data flow'
              steps={[
                { label: 'Component', tone: 'ui' },
                { detail: 'mutate()', label: 'Server', tone: 'server' },
                { detail: 'invalidate + refetch', label: 'Cache', tone: 'client' },
                { label: 'Component', tone: 'ui' },
              ]}
            />
            <p>Components talk to the server. The cache only remembers answers.</p>
          </div>
          <div>
            <h3>TanStack DB</h3>
            <FlowDiagram
              label='TanStack DB data flow'
              steps={[
                { label: 'Component', tone: 'ui' },
                { detail: 'update()', label: 'Collection', tone: 'client' },
                { detail: 'handler, in the background', label: 'Server', tone: 'server' },
              ]}
            />
            <p>
              Components talk to the <strong>local collection</strong>. The collection talks to the
              server.
            </p>
          </div>
        </div>
      </section>

      <ReactQuerySteps />
      <Playground />
      <TanstackDbSteps />
      <TimingSection />
      <CostsSection />

      <section className={css.section}>
        <h2>What PR #227 changed in Veles</h2>
        <ul className={css.pains}>
          {prChanges.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
      </section>

      <section className={css.section}>
        <h2>Cheat sheet</h2>
        <dl className={css.cheatSheet}>
          {cheatSheet.map(([term, meaning]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{meaning}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
