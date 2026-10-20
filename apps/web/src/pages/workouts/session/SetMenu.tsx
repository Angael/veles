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
import { useI18n } from '@/lib/i18n/I18nProvider';

type SetMenuProps = {
  actions: SessionActions;
  set: WorkoutSetData;
  update: (patch: SetPatch) => void;
};

/** Long-press menu of a set row: type, duplicate, copy last time, delete. */
export function SetMenu({ actions, set, update }: SetMenuProps) {
  const { t } = useI18n();

  return (
    <ContextMenuPopup aria-label={t({ en: 'Set actions', pl: 'Akcje serii' })}>
      <ContextMenuSubmenuRoot>
        <ContextMenuSubmenuTrigger
          icon={<LayersIcon aria-hidden='true' />}
          label={t({
            en: `Type: ${t(SET_TYPE_LABELS[set.type])}`,
            pl: `Typ: ${t(SET_TYPE_LABELS[set.type])}`,
          })}
        />
        <ContextMenuPopup aria-label={t({ en: 'Set type', pl: 'Typ serii' })}>
          {SET_TYPES.map((type) => (
            <ContextMenuItem
              icon={
                type === set.type ? (
                  <CheckIcon aria-hidden='true' />
                ) : (
                  <span className={css.menuBadge}>
                    {type === 'normal' ? '1' : t(SET_BADGE[type])}
                  </span>
                )
              }
              key={type}
              label={t(SET_TYPE_LABELS[type])}
              onClick={() => update({ type })}
            />
          ))}
        </ContextMenuPopup>
      </ContextMenuSubmenuRoot>
      <ContextMenuItem
        icon={<CopyIcon aria-hidden='true' />}
        label={t({ en: 'Duplicate set', pl: 'Powiel serię' })}
        onClick={() => actions.duplicateSet(set.id)}
      />
      <ContextMenuItem
        disabled={!set.previous}
        icon={<HistoryIcon aria-hidden='true' />}
        label={t({ en: 'Same as last time', pl: 'Tak jak ostatnio' })}
        onClick={() => set.previous && update(set.previous)}
      />
      <ContextMenuSeparator />
      <ContextMenuItem
        icon={<Trash2Icon aria-hidden='true' />}
        label={t({ en: 'Delete set', pl: 'Usuń serię' })}
        onClick={() => actions.removeSet(set.id)}
        variant='danger'
      />
    </ContextMenuPopup>
  );
}
