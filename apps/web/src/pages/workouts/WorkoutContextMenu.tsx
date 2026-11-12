import { BookmarkPlusIcon, Trash2Icon } from 'lucide-react';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { RoutineDialog } from './routines/RoutineDialog';
import { useSaveRoutineFromWorkoutMutation } from './routines/routines.query';
import type { WorkoutSummary } from './workouts.server';
import { useDeleteWorkoutMutation } from './workouts.query';
import { useI18n } from '@/lib/i18n/I18nProvider';

type WorkoutContextMenuProps = {
  children: ReactNode;
  trigger: ComponentProps<typeof ContextMenuTrigger>['render'];
  workout: WorkoutSummary;
};

/** Long press or right click on a workout, wherever it is shown: save as a routine or delete. */
export function WorkoutContextMenu({ children, trigger, workout }: WorkoutContextMenuProps) {
  const { t } = useI18n();
  const deleteWorkout = useDeleteWorkoutMutation();
  const saveRoutine = useSaveRoutineFromWorkoutMutation();
  const [saving, setSaving] = useState(false);

  return (
    <>
      <ContextMenuRoot>
        <ContextMenuTrigger render={trigger}>{children}</ContextMenuTrigger>
        <ContextMenuPopup
          aria-label={t({ en: `${workout.name} actions`, pl: `Akcje: ${workout.name}` })}
        >
          <ContextMenuItem
            disabled={workout.exerciseCount === 0}
            icon={<BookmarkPlusIcon aria-hidden='true' />}
            label={t({ en: 'Save as routine', pl: 'Zapisz jako plan' })}
            onClick={() => setSaving(true)}
          />
          <ContextMenuItem
            icon={<Trash2Icon aria-hidden='true' />}
            label={t({ en: 'Delete workout', pl: 'Usuń trening' })}
            onClick={() => {
              if (
                window.confirm(
                  t({
                    en: `Delete “${workout.name}” and its sets?`,
                    pl: `Usunąć „${workout.name}” razem z seriami?`,
                  }),
                )
              ) {
                deleteWorkout.mutate({ id: workout.id });
              }
            }}
            variant='danger'
          />
        </ContextMenuPopup>
      </ContextMenuRoot>
      <RoutineDialog
        defaults={{ description: '', name: workout.name }}
        onOpenChange={setSaving}
        onSubmit={(values) => saveRoutine.mutateAsync({ ...values, workoutId: workout.id })}
        open={saving}
        pending={saveRoutine.isPending}
        submitLabel={t({ en: 'Save routine', pl: 'Zapisz plan' })}
        title={t({ en: 'Save as routine', pl: 'Zapisz jako plan' })}
      />
    </>
  );
}
