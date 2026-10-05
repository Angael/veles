import { CheckIcon, MinusIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card/Card';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { describeSet, SHORTHAND_EXAMPLES, type ParsedSet } from '../setShorthand';
import { ScrubNumber } from './ScrubNumber';
import { ShorthandInput } from './ShorthandInput';
import { StepperSheet, type StepperValue } from './StepperSheet';
import css from './Inputs.module.css';

/** Four ways to enter a set, side by side, so the nicest one can be picked. */
export function InputsDemo() {
  return (
    <div className={css.grid}>
      <ShorthandCard />
      <OneTapCard />
      <StepperCard />
      <ScrubCard />
    </div>
  );
}

function ShorthandCard() {
  const [example, setExample] = useState<string>(SHORTHAND_EXAMPLES[2][0]);
  const [logged, setLogged] = useState<ParsedSet[]>([]);
  return (
    <Card as='section' className={css.demo}>
      <h2>A. Type it</h2>
      <p className={css.hint}>One field, live preview. Fastest on desktop, fine on phones.</p>
      <ShorthandInput defaultValue={example} key={example} onSubmit={setLogged} />
      {logged.length > 0 ? (
        <p className={css.hint}>Added {logged.map((set) => describeSet(set)).join(', ')}</p>
      ) : null}
      <dl className={css.cheatSheet}>
        {SHORTHAND_EXAMPLES.map(([code, meaning]) => (
          <div key={code}>
            <dt>
              <button onClick={() => setExample(code)} type='button'>
                {code}
              </button>
            </dt>
            <dd>{meaning}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/** The smallest possible UI: the next set is one big button; long press to tweak it. */
function OneTapCard() {
  const [next, setNext] = useState({ reps: 5, weightKg: 80 });
  const [done, setDone] = useState<string[]>([]);
  const nudge = (patch: Partial<typeof next>) => setNext((current) => ({ ...current, ...patch }));
  return (
    <Card as='section' className={css.demo}>
      <h2>B. One tap</h2>
      <p className={css.hint}>
        Tap logs the suggested set. Long press / right click adjusts it first.
      </p>
      <ContextMenuRoot>
        <ContextMenuTrigger
          className={css.oneTap}
          render={
            <button
              onClick={() => setDone((list) => [...list, `${next.weightKg} × ${next.reps}`])}
              type='button'
            />
          }
        >
          <CheckIcon aria-hidden='true' />
          <span>
            Set {done.length + 1}: {next.weightKg} kg × {next.reps}
          </span>
        </ContextMenuTrigger>
        <ContextMenuPopup aria-label='Adjust next set'>
          <ContextMenuItem
            icon={<PlusIcon aria-hidden='true' />}
            label='+2.5 kg'
            onClick={() => nudge({ weightKg: next.weightKg + 2.5 })}
          />
          <ContextMenuItem
            icon={<MinusIcon aria-hidden='true' />}
            label='−2.5 kg'
            onClick={() => nudge({ weightKg: next.weightKg - 2.5 })}
          />
          <ContextMenuSeparator />
          <ContextMenuItem
            icon={<PlusIcon aria-hidden='true' />}
            label='+1 rep'
            onClick={() => nudge({ reps: next.reps + 1 })}
          />
          <ContextMenuItem
            icon={<MinusIcon aria-hidden='true' />}
            label='−1 rep'
            onClick={() => nudge({ reps: Math.max(0, next.reps - 1) })}
          />
        </ContextMenuPopup>
      </ContextMenuRoot>
      {done.length > 0 ? <p className={css.hint}>Logged: {done.join(' · ')}</p> : null}
    </Card>
  );
}

function StepperCard() {
  const previous: StepperValue = { reps: 5, weightKg: 80 };
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(previous);
  const [saved, setSaved] = useState<StepperValue | null>(null);
  return (
    <Card as='section' className={css.demo}>
      <h2>C. Stepper sheet</h2>
      <p className={css.hint}>Tap a set row; big numbers and thumb-sized steppers.</p>
      <button className={css.fakeRow} onClick={() => setOpen(true)} type='button'>
        <span>2</span>
        <span>{saved ? `${saved.weightKg} kg × ${saved.reps}` : 'Tap to log'}</span>
      </button>
      <StepperSheet
        onChange={setValue}
        onDone={() => {
          setSaved(value);
          setOpen(false);
        }}
        onOpenChange={setOpen}
        open={open}
        previous={previous}
        title='Bench, set 2'
        value={value}
      />
    </Card>
  );
}

function ScrubCard() {
  const [weightKg, setWeightKg] = useState(80);
  const [reps, setReps] = useState(5);
  return (
    <Card as='section' className={css.demo}>
      <h2>D. Scrub</h2>
      <p className={css.hint}>Drag a number sideways to change it; tap to type.</p>
      <div className={css.scrubRow}>
        <ScrubNumber label='Weight' onChange={setWeightKg} step={2.5} unit='kg' value={weightKg} />
        <ScrubNumber
          label='Reps'
          onChange={setReps}
          pixelsPerStep={18}
          step={1}
          unit='reps'
          value={reps}
        />
      </div>
    </Card>
  );
}
