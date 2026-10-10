import { XIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { DragDemo } from './DragDemos';
import { LongPressDemo, SetTypeDemo } from './GestureDemos';
import css from './Hints.module.css';

export type Hint = { key: string; title: string; Demo: ComponentType };

/** Every first-use tip, in the order a new user meets them in a session. */
export const HINTS: Hint[] = [
  {
    Demo: DragDemo,
    key: 'drag',
    title: 'Drag numbers',
  },
  {
    Demo: LongPressDemo,
    key: 'longpress',
    title: 'Hold for more',
  },
  {
    Demo: SetTypeDemo,
    key: 'settype',
    title: 'Tap set number for warm-up, drop set or failure',
  },
];

type FeatureTipProps = { hint: Hint; onDismiss?: () => void };

/** A looping mini demo with its title. Shown once, right where the gesture applies. */
export function FeatureTip({ hint, onDismiss }: FeatureTipProps) {
  const { Demo } = hint;
  return (
    <aside aria-label={hint.title} className={css.tip}>
      <Demo />
      <strong className={css.tipTitle}>{hint.title}</strong>
      {onDismiss ? (
        <Btn
          aria-label='Got it'
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
