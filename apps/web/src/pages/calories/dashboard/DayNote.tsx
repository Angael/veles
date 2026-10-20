import { useDebouncer } from '@tanstack/react-pacer';
import { useEffect, useRef } from 'react';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { Toggle } from '@/components/ui/toggle/Toggle';
import { useSetFoodDayNoteMutation } from './foodDayNote.query';
import { useI18n } from '@/lib/i18n/I18nProvider';
import css from './DayNote.module.css';

const NOTE_SAVE_DELAY_MS = 600;
const NOTE_MAX_LENGTH = 500;

type DayNoteProps = {
  date: string;
  note: string | null;
  offPlan: boolean;
};

/**
 * Optional free note and off-plan flag for one day. The note saves when typing pauses, on blur,
 * and when the page hides or unmounts, so a quick note is not lost.
 */
export function DayNote({ date, note, offPlan }: DayNoteProps) {
  const { t } = useI18n();
  const setDayNote = useSetFoodDayNoteMutation();
  const savedNote = useRef(note ?? '');

  const noteSaver = useDebouncer(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed === savedNote.current) return;
      savedNote.current = trimmed;
      setDayNote.mutate({ date, note: trimmed });
    },
    { onUnmount: (debouncer) => debouncer.flush(), wait: NOTE_SAVE_DELAY_MS },
  );

  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') noteSaver.flush();
    };
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => document.removeEventListener('visibilitychange', flushWhenHidden);
  }, [noteSaver]);

  return (
    <section
      aria-label={t({ en: 'Day note', pl: 'Notatka dnia' })}
      className={css.dayNote}
      data-appear='2'
    >
      <SeamlessTextarea
        aria-label={t({ en: 'Note for this day', pl: 'Notatka do tego dnia' })}
        className={css.note}
        defaultValue={note ?? ''}
        maxLength={NOTE_MAX_LENGTH}
        onBlur={() => noteSaver.flush()}
        onChange={(event) => noteSaver.maybeExecute(event.target.value)}
        placeholder={t({ en: 'Add a note for this day…', pl: 'Dodaj notatkę do tego dnia…' })}
        rows={1}
      />
      <label className={css.offPlan} data-checked={offPlan || undefined}>
        <span>{t({ en: 'Off plan', pl: 'Poza planem' })}</span>
        <Toggle
          checked={offPlan}
          onCheckedChange={(checked) => setDayNote.mutate({ date, offPlan: checked })}
        />
      </label>
    </section>
  );
}
