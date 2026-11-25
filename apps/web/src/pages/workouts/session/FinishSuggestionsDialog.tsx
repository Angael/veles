import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import {
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { describeSet, SET_BADGE } from '../metrics';
import type { SuggestedExercise } from './finishSuggestions';
import css from './FinishSuggestions.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type FinishSuggestionsDialogProps = {
  exercises: SuggestedExercise[];
  loading: boolean;
  onFinish: (acceptSetIds: string[]) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

/**
 * Lists every unticked set with values (typed or last time's) and lets the user tick the ones done.
 * Nothing starts ticked, so a set counts as done only after an explicit tick.
 * The parent remounts it per review (`key`), so ticks from a dismissed review never carry over.
 */
export function FinishSuggestionsDialog({
  exercises,
  loading,
  onFinish,
  onOpenChange,
  open,
}: FinishSuggestionsDialogProps) {
  const { locale, t } = useI18n();
  const [accepted, setAccepted] = useState<ReadonlySet<string>>(new Set());
  const allIds = exercises.flatMap((exercise) => exercise.sets.map((set) => set.id));
  const allAccepted = allIds.length > 0 && allIds.every((id) => accepted.has(id));

  function toggle(ids: string[], checked: boolean) {
    setAccepted((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogTitle>{t({ en: 'Unticked sets', pl: 'Nieodhaczone serie' })}</DialogTitle>
        <DialogDescription>
          {t({
            en: 'Only ticked sets count as done. Tick the sets you did; empty cells take last time’s values. Others stay not done.',
            pl: 'Tylko odhaczone serie są wykonane. Zaznacz wykonane serie; puste pola dostaną wartości z ostatniego razu. Reszta zostanie niewykonana.',
          })}
        </DialogDescription>
        <ul className={css.list}>
          {exercises.map((exercise) => {
            const ids = exercise.sets.map((set) => set.id);
            return (
              <li className={css.exercise} key={exercise.id}>
                <label className={css.exerciseName}>
                  <Checkbox
                    checked={ids.every((id) => accepted.has(id))}
                    onCheckedChange={(checked) => toggle(ids, checked)}
                  />
                  {exercise.name}
                </label>
                <div className={css.sets}>
                  {exercise.sets.map((set) => (
                    <label className={css.set} key={set.id}>
                      <Checkbox
                        checked={accepted.has(set.id)}
                        onCheckedChange={(checked) => toggle([set.id], checked)}
                      />
                      <span className={css.badge}>
                        {set.type === 'normal' ? set.number : t(SET_BADGE[set.type])}
                      </span>
                      {describeSet(set.filled, locale)}
                    </label>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
        <DialogActions className={css.actions}>
          <Btn onClick={() => toggle(allIds, !allAccepted)} size='sm' variant='ghost'>
            {allAccepted
              ? t({ en: 'Clear all', pl: 'Odznacz wszystkie' })
              : t({ en: 'Tick all', pl: 'Zaznacz wszystkie' })}
          </Btn>
          <DialogClose render={<Btn variant='ghost' />}>
            {t({ en: 'Back', pl: 'Wróć' })}
          </DialogClose>
          <Btn loading={loading} onClick={() => onFinish([...accepted])}>
            {t({ en: 'Finish', pl: 'Zakończ' })}
          </Btn>
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}
