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
import { useI18n } from '@/lib/i18n/I18nProvider';

/**
 * Rare session actions: save the exercises as a new routine, or overwrite the routine this
 * session came from. Routines keep exercises, set counts and set types, never the numbers.
 */
export function SessionMenu({ session }: { session: WorkoutSessionData }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const saveRoutine = useSaveRoutineFromWorkoutMutation();
  const updateRoutine = useUpdateRoutineFromWorkoutMutation();
  const empty = session.slots.length === 0;

  return (
    <>
      <MenuBtnRoot>
        <Btn
          aria-label={t({ en: 'More workout actions', pl: 'Więcej akcji treningu' })}
          icon={<EllipsisIcon aria-hidden='true' />}
          iconOnly
          render={<MenuBtn />}
          radius='pill'
          size='sm'
          variant='ghost'
        />
        <MenuBtnPopup
          aria-label={t({ en: 'Workout actions', pl: 'Akcje treningu' })}
          heading={t({ en: 'Workout', pl: 'Trening' })}
        >
          <MenuBtnItem
            description={t({
              en: 'Start it again later with the same exercises',
              pl: 'Rozpocznij go później z tymi samymi ćwiczeniami',
            })}
            disabled={empty}
            icon={<BookmarkPlusIcon aria-hidden='true' />}
            label={t({ en: 'Save as new routine', pl: 'Zapisz jako nowy plan' })}
            onClick={() => setSaving(true)}
          />
          {session.routine ? (
            <MenuBtnItem
              description={t({
                en: 'Replace its exercises and sets with these',
                pl: 'Zastąp jego ćwiczenia i serie tymi',
              })}
              disabled={empty || updateRoutine.isPending}
              icon={<RefreshCwIcon aria-hidden='true' />}
              label={t({
                en: `Update routine “${session.routine.name}”`,
                pl: `Zaktualizuj plan „${session.routine.name}”`,
              })}
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
        submitLabel={t({ en: 'Save routine', pl: 'Zapisz plan' })}
        title={t({ en: 'Save as routine', pl: 'Zapisz jako plan' })}
      />
    </>
  );
}
