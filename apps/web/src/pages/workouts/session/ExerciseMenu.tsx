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
  return (
    <ContextMenuPopup aria-label={`${slot.name} actions`}>
      <ContextMenuItem icon={<PencilIcon aria-hidden='true' />} label='Rename' onClick={onRename} />
      <ContextMenuSubmenuRoot>
        <ContextMenuSubmenuTrigger
          icon={<RulerIcon aria-hidden='true' />}
          label={`Track: ${MEASURE_LABELS[slot.measure]}`}
        />
        <ContextMenuPopup aria-label='What to track'>
          {MEASURES.map((measure) => (
            <ContextMenuItem
              icon={measure === slot.measure ? <CheckIcon aria-hidden='true' /> : <span />}
              key={measure}
              label={MEASURE_LABELS[measure]}
              onClick={() => actions.updateExercise(slot.exerciseId, { measure })}
            />
          ))}
        </ContextMenuPopup>
      </ContextMenuSubmenuRoot>
      <ContextMenuSubmenuRoot>
        <ContextMenuSubmenuTrigger icon={<TimerIcon aria-hidden='true' />} label='Rest timer' />
        <ContextMenuPopup aria-label='Rest timer'>
          {REST_PRESETS.map((seconds) => (
            <ContextMenuItem
              icon={seconds === slot.restSeconds ? <CheckIcon aria-hidden='true' /> : <span />}
              key={seconds ?? 'off'}
              label={seconds === null ? 'Off' : formatDuration(seconds)}
              onClick={() => actions.updateExercise(slot.exerciseId, { restSeconds: seconds })}
            />
          ))}
        </ContextMenuPopup>
      </ContextMenuSubmenuRoot>
      <ContextMenuItem
        disabled={isFirst}
        icon={<ArrowUpIcon aria-hidden='true' />}
        label='Move up'
        onClick={() => actions.moveSlot(slot.id, 'up')}
      />
      <ContextMenuItem
        disabled={isLast}
        icon={<ArrowDownIcon aria-hidden='true' />}
        label='Move down'
        onClick={() => actions.moveSlot(slot.id, 'down')}
      />
      <ContextMenuSeparator />
      <ContextMenuItem
        icon={<Trash2Icon aria-hidden='true' />}
        label='Remove exercise'
        onClick={() => actions.removeSlot(slot.id)}
        variant='danger'
      />
    </ContextMenuPopup>
  );
}
