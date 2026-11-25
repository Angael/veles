import clsx from 'clsx';
import { ArrowRightIcon, ArrowUpDownIcon, MinusIcon, PlusIcon, RepeatIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { SET_BADGE, type SetType, workingSetNumbers } from '../metrics';
import type { RoutineChange, RoutineReview } from './routineReview';
import css from './RoutineReview.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type RoutineReviewDialogProps = {
  review: RoutineReview | null;
  /** The routine changed elsewhere since the review opened; Update gives way to Review again. */
  conflict: boolean;
  pending: boolean;
  reloading: boolean;
  onKeep: () => void;
  onReviewAgain: () => void;
  onUpdate: () => void;
};

/**
 * Asks after Finish whether the routine should take this workout's changes. Lists only what
 * differs, each exercise once, with its sets before and after. Closing it keeps the routine.
 */
export function RoutineReviewDialog({
  conflict,
  onKeep,
  onReviewAgain,
  onUpdate,
  pending,
  reloading,
  review,
}: RoutineReviewDialogProps) {
  const { t } = useI18n();

  return (
    <DialogRoot
      onOpenChange={(open) => {
        if (!open) onKeep();
      }}
      open={review !== null}
    >
      <DialogPopup>
        {review ? (
          <>
            <DialogTitle>
              {t({
                en: `Update routine “${review.routineName}”?`,
                pl: `Zaktualizować plan „${review.routineName}”?`,
              })}
            </DialogTitle>
            <DialogDescription>
              {t({
                en: 'Workout saved, but it differs from the routine. Overwrite the routine?',
                pl: 'Trening zapisany, ale różni się od planu. Czy nadpisać istniejący plan?',
              })}
            </DialogDescription>
            <ul className={css.changes}>
              {review.changes.map((change) => (
                <ChangeRow change={change} key={change.key} />
              ))}
            </ul>
            {conflict ? (
              <p className={css.conflict} role='alert'>
                {t({
                  en: 'This routine changed elsewhere after this review opened, so nothing was overwritten. Compare again or keep it as it is now.',
                  pl: 'Ten plan zmienił się gdzie indziej po otwarciu tego podglądu, więc nic nie nadpisano. Porównaj ponownie lub zostaw go jak jest teraz.',
                })}
              </p>
            ) : null}
            <DialogActions>
              <Btn disabled={pending || reloading} onClick={onKeep} variant='ghost'>
                {t({ en: 'Keep routine', pl: 'Zostaw plan' })}
              </Btn>
              {conflict ? (
                <Btn loading={reloading} onClick={onReviewAgain}>
                  {t({ en: 'Compare again', pl: 'Porównaj ponownie' })}
                </Btn>
              ) : (
                <Btn loading={pending} onClick={onUpdate}>
                  {t({ en: 'Update routine', pl: 'Zaktualizuj plan' })}
                </Btn>
              )}
            </DialogActions>
          </>
        ) : null}
      </DialogPopup>
    </DialogRoot>
  );
}

/**
 * One exercise: icon and name, then its sets before → after where that helps. The icon already
 * says what happened, so only a move gets text (its positions).
 */
function ChangeRow({ change }: { change: RoutineChange }) {
  const { t } = useI18n();
  const { after, before, move, setsChanged } = change;
  const showBefore = before !== null && (after === null || setsChanged);
  const showAfter = after !== null && (before === null || setsChanged);

  return (
    <li className={clsx(css.change, after === null && css.removed)}>
      <span className={css.icon}>
        <ChangeIcon change={change} />
      </span>
      <span className={css.text}>
        <strong>{change.name}</strong>
        {move ? (
          <small>
            {t({
              en: `Moved from #${move.from} to #${move.to}`,
              pl: `Przeniesione z ${move.from}. na ${move.to}. miejsce`,
            })}
          </small>
        ) : null}
      </span>
      <span className={css.sets}>
        {showBefore ? <SetChips types={before} /> : null}
        {setsChanged ? <ArrowRightIcon aria-hidden='true' className={css.arrow} /> : null}
        {showAfter ? <SetChips types={after} /> : null}
      </span>
    </li>
  );
}

/** Added, removed, sets changed, or only moved, in that order of importance. */
function ChangeIcon({ change }: { change: RoutineChange }) {
  if (change.before === null) return <PlusIcon aria-hidden='true' />;
  if (change.after === null) return <MinusIcon aria-hidden='true' />;
  if (change.setsChanged) return <RepeatIcon aria-hidden='true' />;
  return <ArrowUpDownIcon aria-hidden='true' />;
}

/** Set chips like the routine page: working-set numbers, letters for the other set types. */
function SetChips({ types }: { types: SetType[] }) {
  const { t } = useI18n();
  const numbers = workingSetNumbers(types.map((type) => ({ type })));
  return (
    <span
      aria-label={t({ en: `${types.length} sets`, pl: `Serie: ${types.length}` })}
      className={css.chips}
      role='img'
    >
      {types.map((type, index) => (
        <span
          aria-hidden='true'
          className={clsx(css.chip, css[`chip_${type}`])}
          // Sets have no id in a plan; the position is the identity.
          key={index}
        >
          {type === 'normal' ? numbers[index] : t(SET_BADGE[type])}
        </span>
      ))}
    </span>
  );
}
