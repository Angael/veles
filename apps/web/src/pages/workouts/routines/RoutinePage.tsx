import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import clsx from 'clsx';
import { PlayIcon, Trash2Icon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { FloatingButton } from '@/components/ui/floating-button/FloatingButton';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { todayLocalDate } from '@/lib/dateOnly';
import { MEASURE_LABELS, SET_BADGE, SHORT_DAY, workingSetNumbers } from '../metrics';
import { workoutsQueryOptions } from '../workouts.query';
import {
  routineQueryOptions,
  useDeleteRoutineMutation,
  useStartRoutineMutation,
  useUpdateRoutineMutation,
} from './routines.query';
import css from './RoutinePage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/**
 * One routine: rename it and edit its description in place, see its exercises with their set
 * types, delete it, or start it. Starting waits while another workout is open.
 */
export function RoutinePage({ routineId }: { routineId: string }) {
  const { formatDate, t } = useI18n();
  const { data: routine } = useSuspenseQuery(routineQueryOptions(routineId));
  const { data: workouts } = useSuspenseQuery(workoutsQueryOptions());
  const navigate = useNavigate();
  const updateRoutine = useUpdateRoutineMutation();
  const deleteRoutine = useDeleteRoutineMutation();
  const startRoutine = useStartRoutineMutation();
  const active = workouts.find((workout) => workout.endedAt === null);

  return (
    <main className={css.page}>
      <Card className={css.header}>
        <SeamlessTextInput
          aria-label={t({ en: 'Routine name', pl: 'Nazwa planu' })}
          className={css.name}
          defaultValue={routine.name}
          key={routine.name}
          onBlur={(event) => {
            const name = event.target.value.trim();
            if (name && name !== routine.name) updateRoutine.mutate({ id: routine.id, name });
          }}
          onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
        />
        <SeamlessTextarea
          aria-label={t({ en: 'Routine description', pl: 'Opis planu' })}
          defaultValue={routine.description}
          key={routine.description}
          onBlur={(event) => {
            const description = event.target.value.trim();
            if (description !== routine.description) {
              updateRoutine.mutate({ description, id: routine.id });
            }
          }}
          placeholder={t({ en: 'Add a description…', pl: 'Dodaj opis…' })}
          rows={1}
        />
        <p className={css.meta}>
          {routine.lastUsed
            ? t({
                en: `Last done ${formatDate(routine.lastUsed, SHORT_DAY)}`,
                pl: `Ostatnio ${formatDate(routine.lastUsed, SHORT_DAY)}`,
              })
            : t({ en: 'Not done yet', pl: 'Jeszcze nie wykonany' })}
        </p>
      </Card>

      {routine.exercises.length === 0 ? (
        <p className={css.hint}>
          {t({ en: 'This routine has no exercises.', pl: 'Ten plan nie ma ćwiczeń.' })}
        </p>
      ) : (
        <ol className={css.exercises}>
          {routine.exercises.map((exercise, index) => {
            const numbers = workingSetNumbers(exercise.setTypes.map((type) => ({ type })));
            return (
              <li className={css.exercise} key={exercise.id}>
                <span className={css.number}>{index + 1}</span>
                <span className={css.exerciseText}>
                  <strong>{exercise.name}</strong>
                  <small>{t(MEASURE_LABELS[exercise.measure])}</small>
                </span>
                <span
                  aria-label={t({
                    en: `${exercise.setTypes.length} sets`,
                    pl: `Serie: ${exercise.setTypes.length}`,
                  })}
                  className={css.sets}
                >
                  {exercise.setTypes.map((type, setIndex) => (
                    <span
                      aria-hidden='true'
                      className={clsx(css.set, css[`set_${type}`])}
                      // Sets have no id of their own here; the position is the identity.
                      key={setIndex}
                    >
                      {type === 'normal' ? numbers[setIndex] : t(SET_BADGE[type])}
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <p className={css.hint}>
        {t({
          en: 'To change exercises, start this routine, edit the workout, then pick “Update routine” in its ⋯ menu.',
          pl: 'Aby zmienić ćwiczenia, rozpocznij ten plan, edytuj trening, a potem wybierz „Zaktualizuj plan” w menu ⋯.',
        })}
      </p>

      <Btn
        className={css.delete}
        icon={<Trash2Icon aria-hidden='true' />}
        onClick={() => {
          const message = t({
            en: `Delete routine “${routine.name}”? Past workouts stay.`,
            pl: `Usunąć plan „${routine.name}”? Wcześniejsze treningi zostaną.`,
          });
          if (!window.confirm(message)) return;
          // Leave first, so the deleted routine is not refetched on this page.
          void navigate({ replace: true, to: '/workouts' });
          deleteRoutine.mutate({ id: routine.id });
        }}
        radius='pill'
        size='sm'
        variant='ghostDanger'
      >
        {t({ en: 'Delete routine', pl: 'Usuń plan' })}
      </Btn>

      {active ? (
        <FloatingButton
          icon={<PlayIcon aria-hidden='true' />}
          render={<Link params={{ id: active.id }} to='/workouts/$id' />}
        >
          {t({ en: 'Continue open workout', pl: 'Kontynuuj otwarty trening' })}
        </FloatingButton>
      ) : (
        <FloatingButton
          icon={<PlayIcon aria-hidden='true' />}
          loading={startRoutine.isPending}
          onClick={() =>
            startRoutine.mutate(
              { date: todayLocalDate(), routineId: routine.id },
              {
                onSuccess: ({ id }) =>
                  void navigate({ params: { id }, replace: true, to: '/workouts/$id' }),
              },
            )
          }
        >
          {t({ en: 'Start routine', pl: 'Rozpocznij plan' })}
        </FloatingButton>
      )}
    </main>
  );
}
