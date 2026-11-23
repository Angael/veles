import { hintFill } from '../metrics';
import type { WorkoutSlotData } from '../workouts.server';
import type { SessionActions } from './session.query';
import css from './Session.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type SkippedExerciseNoteProps = { actions: SessionActions; slot: WorkoutSlotData };

/** Warns that Finish drops this untouched exercise; one tap saves it as done with the hints. */
export function SkippedExerciseNote({ actions, slot }: SkippedExerciseNoteProps) {
  const { t } = useI18n();
  const markDone = () => {
    for (const set of slot.sets) {
      if (!set.done) actions.updateSet(set.id, { ...hintFill(set, slot.measure), done: true });
    }
  };

  return (
    <div className={css.skippedNote}>
      <span>
        {t({
          en: 'Will be skipped if you finish now',
          pl: 'Zostanie pominięte, jeśli zakończysz teraz',
        })}
      </span>
      {slot.sets.length > 0 && (
        <button className={css.skippedDone} onClick={markDone} type='button'>
          {t({ en: 'Did it as suggested', pl: 'Zrobione wg sugestii' })}
        </button>
      )}
    </div>
  );
}
