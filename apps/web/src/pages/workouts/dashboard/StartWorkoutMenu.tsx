import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { DumbbellIcon, PlayIcon, PlusIcon } from 'lucide-react';
import { FloatingButton } from '@/components/ui/floating-button/FloatingButton';
import {
  MenuBtn,
  MenuBtnChevron,
  MenuBtnDivider,
  MenuBtnItem,
  MenuBtnPopup,
  MenuBtnRoot,
} from '@/components/ui/menu-btn/MenuBtn';
import { useTodayLocalDate } from '@/lib/useTodayLocalDate';
import { ElapsedTime } from '../ElapsedTime';
import { routinesQueryOptions, useStartRoutineMutation } from '../routines/routines.query';
import type { WorkoutSummary } from '../workouts.server';
import { useStartWorkoutMutation } from '../workouts.query';
import css from './WorkoutsDashboardPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';

/**
 * Floating button whose only job is getting into a workout. While one is open it continues that
 * workout. Otherwise it offers an empty workout or a routine, and either choice starts right away.
 * Archived routines are left out. Without routines there is nothing to choose, so it starts an empty workout directly.
 */
export function StartWorkoutMenu({ active }: { active: WorkoutSummary | undefined }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const today = useTodayLocalDate();
  const { data: allRoutines } = useSuspenseQuery(routinesQueryOptions());
  const routines = allRoutines.filter((routine) => !routine.archived);
  const startWorkout = useStartWorkoutMutation();
  const startRoutine = useStartRoutineMutation();
  const open = ({ id }: { id: string }) => void navigate({ params: { id }, to: '/workouts/$id' });
  const startEmpty = () => startWorkout.mutate({ date: today }, { onSuccess: open });
  const loading = startWorkout.isPending || startRoutine.isPending;
  const startLabel = t({ en: 'Start workout', pl: 'Rozpocznij trening' });

  if (active) {
    return (
      <FloatingButton
        icon={<PlayIcon aria-hidden='true' />}
        render={<Link params={{ id: active.id }} to='/workouts/$id' />}
      >
        {t({ en: 'Continue', pl: 'Kontynuuj' })} ·{' '}
        {active.startedAt ? <ElapsedTime startedAt={active.startedAt} /> : active.name}
      </FloatingButton>
    );
  }

  if (routines.length === 0) {
    return (
      <FloatingButton icon={<PlusIcon aria-hidden='true' />} loading={loading} onClick={startEmpty}>
        {t({ en: 'Empty workout', pl: 'Pusty trening' })}
      </FloatingButton>
    );
  }

  return (
    <MenuBtnRoot>
      <FloatingButton
        icon={<PlusIcon aria-hidden='true' />}
        loading={loading}
        render={<MenuBtn openOnHover />}
      >
        {startLabel}
        <MenuBtnChevron />
      </FloatingButton>
      <MenuBtnPopup
        aria-label={startLabel}
        className={css.startMenu}
        description={t({
          en: 'Start from scratch or follow a routine.',
          pl: 'Zacznij od zera albo według planu.',
        })}
        heading={startLabel}
      >
        <MenuBtnItem
          description={t({ en: 'Add exercises as you go', pl: 'Dodawaj ćwiczenia na bieżąco' })}
          icon={<PlusIcon aria-hidden='true' />}
          label={t({ en: 'Empty workout', pl: 'Pusty trening' })}
          onClick={startEmpty}
        />
        <MenuBtnDivider />
        {routines.map((routine) => {
          const count = routine.exerciseNames.length;
          return (
            <MenuBtnItem
              description={t({
                en: `${count} ${pluralEn(count, 'exercise', 'exercises')}`,
                pl: `${count} ${pluralPl(count, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')}`,
              })}
              icon={<DumbbellIcon aria-hidden='true' />}
              key={routine.id}
              label={routine.name}
              onClick={() =>
                startRoutine.mutate({ date: today, routineId: routine.id }, { onSuccess: open })
              }
            />
          );
        })}
      </MenuBtnPopup>
    </MenuBtnRoot>
  );
}
