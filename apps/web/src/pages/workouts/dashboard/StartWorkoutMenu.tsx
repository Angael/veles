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
import { todayLocalDate } from '@/lib/dateOnly';
import { routinesQueryOptions, useStartRoutineMutation } from '../routines/routines.query';
import type { WorkoutSummary } from '../workouts.api';
import { useStartWorkoutMutation } from '../workouts.query';

/**
 * Floating start button: a menu with an empty workout and every routine. While a workout is
 * open it only links back to it, because the server allows one open workout at a time.
 */
export function StartWorkoutMenu({ active }: { active: WorkoutSummary | undefined }) {
  const { data: routines } = useSuspenseQuery(routinesQueryOptions());
  const navigate = useNavigate();
  const startWorkout = useStartWorkoutMutation();
  const startRoutine = useStartRoutineMutation();
  const openSession = ({ id }: { id: string }) =>
    void navigate({ params: { id }, to: '/workouts/$id' });

  if (active) {
    return (
      <FloatingButton
        icon={<PlayIcon aria-hidden='true' />}
        render={<Link params={{ id: active.id }} to='/workouts/$id' />}
      >
        Continue workout
      </FloatingButton>
    );
  }

  return (
    <MenuBtnRoot>
      <FloatingButton
        icon={<PlusIcon aria-hidden='true' />}
        loading={startWorkout.isPending || startRoutine.isPending}
        render={<MenuBtn />}
      >
        Start workout
        <MenuBtnChevron />
      </FloatingButton>
      <MenuBtnPopup aria-label='Start workout' heading='Start workout'>
        <MenuBtnItem
          description='Add exercises as you go'
          icon={<PlusIcon aria-hidden='true' />}
          label='Empty workout'
          onClick={() =>
            startWorkout.mutate({ date: todayLocalDate() }, { onSuccess: openSession })
          }
        />
        {routines.length > 0 ? <MenuBtnDivider /> : null}
        {routines.map((routine) => (
          <MenuBtnItem
            description={routine.exerciseNames.join(' · ') || 'No exercises'}
            icon={<DumbbellIcon aria-hidden='true' />}
            key={routine.id}
            label={routine.name}
            onClick={() =>
              startRoutine.mutate(
                { date: todayLocalDate(), routineId: routine.id },
                { onSuccess: openSession },
              )
            }
          />
        ))}
      </MenuBtnPopup>
    </MenuBtnRoot>
  );
}
