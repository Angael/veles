import { XIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { DragDemo } from './DragDemos';
import { LongPressDemo, TypeSetsDemo } from './GestureDemos';
import css from './Hints.module.css';

export type Hint = { key: string; title: string; text: string; Demo: ComponentType };

/** Every first-use tip, in the order a new user meets them in a session. */
export const HINTS: Hint[] = [
  {
    Demo: DragDemo,
    key: 'drag',
    text: 'Slide a number sideways. Slow = small steps, fast = big jumps.',
    title: 'Drag numbers',
  },
  {
    Demo: LongPressDemo,
    key: 'longpress',
    text: 'Hold any row or exercise name for more: set type, duplicate, delete. Right click on desktop.',
    title: 'Hold for more',
  },
  {
    Demo: TypeSetsDemo,
    key: 'type-sets',
    text: '“Add several…” takes text: 80x5x3 is three sets of 80 kg × 5.',
    title: 'Add several sets',
  },
];

type FeatureTipProps = { hint: Hint; onDismiss?: () => void };

/** A looping mini demo next to one sentence. Shown once, before the user needs the feature. */
export function FeatureTip({ hint, onDismiss }: FeatureTipProps) {
  const { Demo } = hint;
  return (
    <aside aria-label={hint.title} className={css.tip}>
      <Demo />
      <div className={css.tipText}>
        <strong>{hint.title}</strong>
        <p>{hint.text}</p>
      </div>
      {onDismiss ? (
        <Btn
          aria-label='Got it'
          className={css.tipClose}
          icon={<XIcon aria-hidden='true' />}
          iconOnly
          onClick={onDismiss}
          size='sm'
          variant='ghost'
        />
      ) : null}
    </aside>
  );
}
