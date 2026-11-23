import { PlusIcon } from 'lucide-react';
import { workingSetNumbers } from '../metrics';
import type { WorkoutSetData, WorkoutSlotData } from '../workouts.server';
import type { SessionActions } from './session.query';
import { SetRow } from './SetRow';
import css from './Session.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type ExerciseSetsProps = {
  actions: SessionActions;
  finished: boolean;
  onOpenSheet: (setId: string, complete: boolean) => void;
  onSetCompleted: (slot: WorkoutSlotData, set: WorkoutSetData) => void;
  slot: WorkoutSlotData;
};

/** The set rows of one exercise and the button that adds a set. */
export function ExerciseSets({
  actions,
  finished,
  onOpenSheet,
  onSetCompleted,
  slot,
}: ExerciseSetsProps) {
  const { t } = useI18n();
  const numbers = workingSetNumbers(slot.sets);

  return (
    <>
      <div className={css.sets} role='table'>
        {slot.sets.map((set, index) => (
          <SetRow
            actions={actions}
            finished={finished}
            key={set.id}
            number={numbers[index] ?? 0}
            onCompleted={(done) => onSetCompleted(slot, done)}
            onOpenSheet={(complete) => onOpenSheet(set.id, complete)}
            set={set}
            slot={slot}
          />
        ))}
      </div>

      <div className={css.cardFooter}>
        <button
          className={css.addSet}
          onClick={() => actions.addSet(slot.id)}
          title={t({
            en: 'Adds one set, copying the last one',
            pl: 'Dodaje jedną serię, kopiując ostatnią',
          })}
          type='button'
        >
          <PlusIcon aria-hidden='true' /> {t({ en: 'Add set', pl: 'Dodaj serię' })}
        </button>
      </div>
    </>
  );
}
