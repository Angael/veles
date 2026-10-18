import { BookmarkPlusIcon, EllipsisIcon, RefreshCwIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { MenuBtn, MenuBtnItem, MenuBtnPopup, MenuBtnRoot } from '@/components/ui/menu-btn/MenuBtn';
import { RoutineDialog } from '../routines/RoutineDialog';
import {
  useSaveRoutineFromWorkoutMutation,
  useUpdateRoutineFromWorkoutMutation,
} from '../routines/routines.query';
import type { WorkoutSessionData } from '../workouts.server';

/**
 * Rare session actions: save the exercises as a new routine, or overwrite the routine this
 * session came from. Routines keep exercises, set counts and set types, never the numbers.
 */
export function SessionMenu({ session }: { session: WorkoutSessionData }) {
  const [saving, setSaving] = useState(false);
  const saveRoutine = useSaveRoutineFromWorkoutMutation();
  const updateRoutine = useUpdateRoutineFromWorkoutMutation();
  const empty = session.slots.length === 0;

  return (
    <>
      <MenuBtnRoot>
        <Btn
          aria-label='More workout actions'
          icon={<EllipsisIcon aria-hidden='true' />}
          iconOnly
          render={<MenuBtn />}
          radius='pill'
          size='sm'
          variant='ghost'
        />
        <MenuBtnPopup aria-label='Workout actions' heading='Workout'>
          <MenuBtnItem
            description='Start it again later with the same exercises'
            disabled={empty}
            icon={<BookmarkPlusIcon aria-hidden='true' />}
            label='Save as new routine'
            onClick={() => setSaving(true)}
          />
          {session.routine ? (
            <MenuBtnItem
              description='Replace its exercises and sets with these'
              disabled={empty || updateRoutine.isPending}
              icon={<RefreshCwIcon aria-hidden='true' />}
              label={`Update routine “${session.routine.name}”`}
              onClick={() => updateRoutine.mutate({ workoutId: session.id })}
            />
          ) : null}
        </MenuBtnPopup>
      </MenuBtnRoot>
      <RoutineDialog
        defaults={{ description: '', name: session.name }}
        onOpenChange={setSaving}
        onSubmit={(values) => saveRoutine.mutateAsync({ ...values, workoutId: session.id })}
        open={saving}
        pending={saveRoutine.isPending}
        submitLabel='Save routine'
        title='Save as routine'
      />
    </>
  );
}
