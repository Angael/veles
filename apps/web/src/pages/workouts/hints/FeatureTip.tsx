import { XIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { DragDemo } from './DragDemos';
import { LongPressDemo, SetTypeDemo } from './GestureDemos';
import css from './Hints.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Localized } from '@/lib/i18n/locale';

export type Hint = { key: string; title: Localized; Demo: ComponentType };

/** Every first-use tip, in the order a new user meets them in a session. */
export const HINTS: Hint[] = [
  {
    Demo: DragDemo,
    key: 'drag',
    title: { en: 'Drag numbers', pl: 'Przeciągaj liczby' },
  },
  {
    Demo: LongPressDemo,
    key: 'longpress',
    title: { en: 'Hold for more', pl: 'Przytrzymaj, aby zobaczyć więcej' },
  },
  {
    Demo: SetTypeDemo,
    key: 'settype',
    title: {
      en: 'Tap set number for warm-up, drop set or failure',
      pl: 'Dotknij numeru serii, aby ustawić rozgrzewkę, drop set lub serię do upadku',
    },
  },
];

type FeatureTipProps = { hint: Hint; onDismiss?: () => void };

/** A looping mini demo with its title. Shown once, right where the gesture applies. */
export function FeatureTip({ hint, onDismiss }: FeatureTipProps) {
  const { t } = useI18n();
  const { Demo } = hint;
  return (
    <aside aria-label={t(hint.title)} className={css.tip}>
      <Demo />
      <strong className={css.tipTitle}>{t(hint.title)}</strong>
      {onDismiss ? (
        <Btn
          aria-label={t({ en: 'Got it', pl: 'Rozumiem' })}
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
