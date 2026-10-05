import { CheckIcon, CopyIcon, HistoryIcon, LayersIcon, Trash2Icon } from 'lucide-react';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuSubmenuRoot,
  ContextMenuSubmenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { SET_TYPE_LABELS, type MockSet, type MockSlot, type SetType } from '../mockData';
import type { SessionActions } from './useMockSession';
import css from './Session.module.css';

export const SET_TYPE_ORDER: SetType[] = ['normal', 'warmup', 'drop', 'failure'];
export const SET_BADGE: Record<Exclude<SetType, 'normal'>, string> = {
  drop: 'D',
  failure: 'F',
  warmup: 'W',
};

type SetMenuProps = {
  actions: SessionActions;
  set: MockSet;
  slot: MockSlot;
  update: (patch: Partial<MockSet>) => void;
};

/** Long-press menu of a set row: type, duplicate, copy last time, delete. */
export function SetMenu({ actions, set, slot, update }: SetMenuProps) {
  return (
    <ContextMenuPopup aria-label='Set actions'>
      <ContextMenuSubmenuRoot>
        <ContextMenuSubmenuTrigger
          icon={<LayersIcon aria-hidden='true' />}
          label={`Type: ${SET_TYPE_LABELS[set.type]}`}
        />
        <ContextMenuPopup aria-label='Set type'>
          {SET_TYPE_ORDER.map((type) => (
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
        onClick={() => actions.duplicateSet(slot.id, set.id)}
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
        onClick={() => actions.removeSet(slot.id, set.id)}
        variant='danger'
      />
    </ContextMenuPopup>
  );
}
