import { Btn } from '@/components/ui/btn/Btn';
import { SliderInput } from '@/components/ui/slider-input/SliderInput';
import { Toggle } from '@/components/ui/toggle/Toggle';
import { clearLog, setFailNextWrite, setLatency, useDemoState } from './fakeServer';
import { ReactQueryLane } from './ReactQueryLane';
import { TanstackDbLane } from './TanstackDbLane';
import css from './TanstackDbDemoPage.module.css';

export function Playground() {
  const { failNextWrite, latencyMs } = useDemoState();

  return (
    <section className={css.section} id='playground'>
      <h2>Try it: same list, two libraries</h2>
      <p>
        Both columns talk to a fake server in your browser. Each one has its own copy of the data.
        Try this:
      </p>
      <ol className={css.steps}>
        <li>
          Set the latency to about 1500 ms. Tick a box in each column. Count how long each one
          waits.
        </li>
        <li>Tick three boxes fast. The left column blocks each row. The right column does not.</li>
        <li>
          Turn on <strong>Fail next write</strong>, then tick a box on the right. It shows at once,
          then jumps back when the server says no. That jump is the automatic rollback.
        </li>
      </ol>
      <div className={css.controls}>
        <SliderInput
          className={css.latency}
          label='Server latency (ms)'
          max={3000}
          min={0}
          onValueChange={setLatency}
          step={100}
          value={latencyMs}
        />
        <label className={css.toggleLabel}>
          <Toggle checked={failNextWrite} onCheckedChange={setFailNextWrite} />
          Fail next write
        </label>
        <Btn onClick={clearLog} size='sm' variant='ghost'>
          Clear logs
        </Btn>
      </div>
      <div className={css.lanes}>
        <ReactQueryLane />
        <TanstackDbLane />
      </div>
      <p className={css.note}>
        Look at the logs. On the left, the UI changes only after <code>PATCH ok</code> and the next{' '}
        <code>GET /items ok</code>. On the right, the UI changes first. Then TanStack DB sends the
        write and refetches by itself.
      </p>
    </section>
  );
}
