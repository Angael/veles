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
import { formatDuration, MEASURE_LABELS, type Measure, type MockSlot } from '../mockData';
import { MEASURE_FIELDS } from './metrics';
import type { SessionActions } from './useMockSession';

export const REST_PRESETS = [null, 45, 60, 90, 120, 180] as const;

type ExerciseMenuProps = {
  actions: SessionActions;
  onRename: () => void;
  slot: MockSlot;
};

/**
 * Everything you rarely need mid-set lives here instead of as buttons on the card: rename,
 * tracking mode, rest length, ordering, removal.
 */
export function ExerciseMenu({ actions, onRename, slot }: ExerciseMenuProps) {
  return (
    <ContextMenuPopup aria-label={`${slot.name} actions`}>
      <ContextMenuItem icon={<PencilIcon aria-hidden='true' />} label='Rename' onClick={onRename} />
      <ContextMenuSubmenuRoot>
        <ContextMenuSubmenuTrigger
          icon={<RulerIcon aria-hidden='true' />}
          label={`Track: ${MEASURE_LABELS[slot.measure]}`}
        />
        <ContextMenuPopup aria-label='What to track'>
          {(Object.keys(MEASURE_FIELDS) as Measure[]).map((measure) => (
            <ContextMenuItem
              icon={measure === slot.measure ? <CheckIcon aria-hidden='true' /> : <span />}
              key={measure}
              label={MEASURE_LABELS[measure]}
              onClick={() => actions.updateSlot(slot.id, { measure })}
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
              onClick={() => actions.updateSlot(slot.id, { restSeconds: seconds })}
            />
          ))}
        </ContextMenuPopup>
      </ContextMenuSubmenuRoot>
      <ContextMenuItem
        icon={<ArrowUpIcon aria-hidden='true' />}
        label='Move up'
        onClick={() => actions.moveSlot(slot.id, -1)}
      />
      <ContextMenuItem
        icon={<ArrowDownIcon aria-hidden='true' />}
        label='Move down'
        onClick={() => actions.moveSlot(slot.id, 1)}
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
