import { CheckIcon, CopyIcon, HistoryIcon, LayersIcon, Trash2Icon } from 'lucide-react';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuSubmenuRoot,
  ContextMenuSubmenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { SET_BADGE, SET_TYPE_LABELS, SET_TYPES } from '../metrics';
import type { WorkoutSetData } from '../workouts.server';
import type { SessionActions, SetPatch } from './session.query';
import css from './Session.module.css';

type SetMenuProps = {
  actions: SessionActions;
  set: WorkoutSetData;
  update: (patch: SetPatch) => void;
};

/** Long-press menu of a set row: type, duplicate, copy last time, delete. */
export function SetMenu({ actions, set, update }: SetMenuProps) {
  return (
    <ContextMenuPopup aria-label='Set actions'>
      <ContextMenuSubmenuRoot>
        <ContextMenuSubmenuTrigger
          icon={<LayersIcon aria-hidden='true' />}
          label={`Type: ${SET_TYPE_LABELS[set.type]}`}
        />
        <ContextMenuPopup aria-label='Set type'>
          {SET_TYPES.map((type) => (
            <ContextMenuItem
              icon={
                type === set.type ? (
                  <CheckIcon aria-hidden='true' />
                ) : (
                  <span className={css.menuBadge}>{type === 'normal' ? '1' : SET_BADGE[type]}</span>
                )
              }
              key={type}
              label={SET_TYPE_LABELS[type]}
              onClick={() => update({ type })}
            />
          ))}
        </ContextMenuPopup>
      </ContextMenuSubmenuRoot>
      <ContextMenuItem
        icon={<CopyIcon aria-hidden='true' />}
        label='Duplicate set'
        onClick={() => actions.duplicateSet(set.id)}
      />
      <ContextMenuItem
        disabled={!set.previous}
        icon={<HistoryIcon aria-hidden='true' />}
        label='Same as last time'
        onClick={() => set.previous && update(set.previous)}
      />
      <ContextMenuSeparator />
      <ContextMenuItem
        icon={<Trash2Icon aria-hidden='true' />}
        label='Delete set'
        onClick={() => actions.removeSet(set.id)}
        variant='danger'
      />
    </ContextMenuPopup>
  );
}
