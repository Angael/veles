import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  PencilIcon,
  RulerIcon,
  TimerIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuSubmenuRoot,
  ContextMenuSubmenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { formatDuration, MEASURE_LABELS, MEASURES } from '../metrics';
import type { WorkoutSlotData } from '../workouts.server';
import type { SessionActions } from './session.query';
import { useI18n } from '@/lib/i18n/I18nProvider';

const REST_PRESETS = [null, 45, 60, 90, 120, 180] as const;

type ExerciseMenuProps = {
  actions: SessionActions;
  isFirst: boolean;
  isLast: boolean;
  onRename: () => void;
  slot: WorkoutSlotData;
};

/**
 * Everything you rarely need mid-set lives here instead of as buttons on the card: rename,
 * tracking mode, rest length, ordering, removal. Name, tracking and rest belong to the exercise,
 * so they carry over to the next workout.
 */
export function ExerciseMenu({ actions, isFirst, isLast, onRename, slot }: ExerciseMenuProps) {
  const { t } = useI18n();
  const restLabel = t({ en: 'Rest timer', pl: 'Czas przerwy' });

  return (
    <ContextMenuPopup aria-label={t({ en: `${slot.name} actions`, pl: `Akcje: ${slot.name}` })}>
      <ContextMenuItem
        icon={<PencilIcon aria-hidden='true' />}
        label={t({ en: 'Rename', pl: 'Zmień nazwę' })}
        onClick={onRename}
      />
      <ContextMenuSubmenuRoot>
        <ContextMenuSubmenuTrigger
          icon={<RulerIcon aria-hidden='true' />}
          label={t({
            en: `Track: ${t(MEASURE_LABELS[slot.measure])}`,
            pl: `Mierz: ${t(MEASURE_LABELS[slot.measure])}`,
          })}
        />
        <ContextMenuPopup aria-label={t({ en: 'What to track', pl: 'Co mierzyć' })}>
          {MEASURES.map((measure) => (
            <ContextMenuItem
              icon={measure === slot.measure ? <CheckIcon aria-hidden='true' /> : <span />}
              key={measure}
              label={t(MEASURE_LABELS[measure])}
              onClick={() => actions.updateExercise(slot.exerciseId, { measure })}
            />
          ))}
        </ContextMenuPopup>
      </ContextMenuSubmenuRoot>
      <ContextMenuSubmenuRoot>
        <ContextMenuSubmenuTrigger icon={<TimerIcon aria-hidden='true' />} label={restLabel} />
        <ContextMenuPopup aria-label={restLabel}>
          {REST_PRESETS.map((seconds) => (
            <ContextMenuItem
              icon={seconds === slot.restSeconds ? <CheckIcon aria-hidden='true' /> : <span />}
              key={seconds ?? 'off'}
              label={seconds === null ? t({ en: 'Off', pl: 'Wyłączony' }) : formatDuration(seconds)}
              onClick={() => actions.updateExercise(slot.exerciseId, { restSeconds: seconds })}
            />
          ))}
        </ContextMenuPopup>
      </ContextMenuSubmenuRoot>
      <ContextMenuItem
        disabled={isFirst}
        icon={<ArrowUpIcon aria-hidden='true' />}
        label={t({ en: 'Move up', pl: 'Przesuń w górę' })}
        onClick={() => actions.moveSlot(slot.id, 'up')}
      />
      <ContextMenuItem
        disabled={isLast}
        icon={<ArrowDownIcon aria-hidden='true' />}
        label={t({ en: 'Move down', pl: 'Przesuń w dół' })}
        onClick={() => actions.moveSlot(slot.id, 'down')}
      />
      <ContextMenuSeparator />
      <ContextMenuItem
        icon={<Trash2Icon aria-hidden='true' />}
        label={t({ en: 'Remove exercise', pl: 'Usuń ćwiczenie' })}
        onClick={() => actions.removeSlot(slot.id)}
        variant='danger'
      />
    </ContextMenuPopup>
  );
}
