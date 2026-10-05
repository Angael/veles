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
import { DragCellsCard, DragFieldCard } from './DragInputsDemo';
import { ShorthandInput } from './ShorthandInput';
import css from './Inputs.module.css';

/** Ways to enter a set, side by side, so the nicest one can be picked. Favourites first. */
export function InputsDemo() {
  return (
    <div className={css.grid}>
      <DragFieldCard />
      <DragCellsCard />
      <ShorthandCard />
      <OneTapCard />
    </div>
  );
}

function ShorthandCard() {
  const [example, setExample] = useState<string>(SHORTHAND_EXAMPLES[2][0]);
  const [logged, setLogged] = useState<ParsedSet[]>([]);
  return (
    <Card as='section' className={css.demo}>
      <h2>C. Type it</h2>
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
      <h2>D. One tap</h2>
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
