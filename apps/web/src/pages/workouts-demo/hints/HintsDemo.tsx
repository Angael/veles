import { RotateCcwIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { toastManager } from '@/components/ui/toast/toastManager';
import { FeatureTip, HINTS } from './FeatureTip';
import { useSeenHints } from './useHints';
import css from './Hints.module.css';

/** Every first-use tip at once, to judge the mini demos without hunting for them. */
export function HintsDemo() {
  const hints = useSeenHints();
  return (
    <div className={css.gallery}>
      <p className={css.galleryIntro}>
        A new user sees these once, one at a time, right where the feature is. The “?” in the
        session header brings them back.
      </p>
      <Btn
        icon={<RotateCcwIcon aria-hidden='true' />}
        onClick={() => {
          hints.reset();
          toastManager.add({ title: 'Tips will show again in the session' });
        }}
        radius='pill'
        size='sm'
        variant='outlineMain'
      >
        Reset seen tips
      </Btn>
      <div className={css.galleryGrid}>
        {HINTS.map((hint) => (
          <FeatureTip hint={hint} key={hint.key} />
        ))}
      </div>
    </div>
  );
}
