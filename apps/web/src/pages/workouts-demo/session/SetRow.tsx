import clsx from 'clsx';
import { CheckIcon, CopyIcon, HistoryIcon, LayersIcon, Trash2Icon } from 'lucide-react';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuSubmenuRoot,
  ContextMenuSubmenuTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import {
  SET_TYPE_LABELS,
  type Measure,
  type MockSet,
  type MockSlot,
  type SetType,
} from '../mockData';
import { describeSet } from '../setShorthand';
import { MetricInput } from './MetricInput';
import type { SessionActions } from './useMockSession';
import css from './Session.module.css';

type MetricKey = 'weightKg' | 'reps' | 'durationSeconds' | 'distanceKm';
type Field = { key: MetricKey; label: string; kind: 'number' | 'time' };

export const MEASURE_FIELDS: Record<Measure, Field[]> = {
  distance_duration: [
    { key: 'distanceKm', kind: 'number', label: 'km' },
    { key: 'durationSeconds', kind: 'time', label: 'time' },
  ],
  duration: [{ key: 'durationSeconds', kind: 'time', label: 'time' }],
  reps: [{ key: 'reps', kind: 'number', label: 'reps' }],
  weight_duration: [
    { key: 'weightKg', kind: 'number', label: 'kg' },
    { key: 'durationSeconds', kind: 'time', label: 'time' },
  ],
  weight_reps: [
    { key: 'weightKg', kind: 'number', label: 'kg' },
    { key: 'reps', kind: 'number', label: 'reps' },
  ],
};

const SET_TYPE_ORDER: SetType[] = ['normal', 'warmup', 'drop', 'failure'];
const BADGE: Record<Exclude<SetType, 'normal'>, string> = { drop: 'D', failure: 'F', warmup: 'W' };

type SetRowProps = {
  actions: SessionActions;
  /** Working-set number; warm-ups and drops don't count, like Strong and Hevy. */
  number: number;
  onCompleted: (set: MockSet) => void;
  set: MockSet;
  slot: MockSlot;
};

/**
 * One set as a spreadsheet-like row. Tap the badge to cycle the set type, tap the check to finish
 * it (empty cells adopt last time's values); everything else hides in the long-press menu.
 */
export function SetRow({ actions, number, onCompleted, set, slot }: SetRowProps) {
  const fields = MEASURE_FIELDS[slot.measure];
  const update = (patch: Partial<MockSet>) => actions.updateSet(slot.id, set.id, patch);

  function toggleDone() {
    if (set.done) return update({ done: false });
    const filled: Partial<MockSet> = { done: true };
    for (const field of fields) {
      if (set[field.key] === null) filled[field.key] = set.previous?.[field.key] ?? null;
    }
    update(filled);
    onCompleted({ ...set, ...filled });
  }

  function cycleType() {
    const next = SET_TYPE_ORDER[(SET_TYPE_ORDER.indexOf(set.type) + 1) % SET_TYPE_ORDER.length];
    update({ type: next ?? 'normal' });
  }

  return (
    <ContextMenuRoot>
      <ContextMenuTrigger
        className={clsx(css.setRow, set.done && css.setDone)}
        data-fields={fields.length}
        render={<div role='row' />}
      >
        <button
          aria-label={`Set type: ${SET_TYPE_LABELS[set.type]}. Tap to change.`}
          className={clsx(css.badge, css[`badge_${set.type}`])}
          onClick={cycleType}
          type='button'
        >
          {set.type === 'normal' ? number : BADGE[set.type]}
        </button>
        <span className={css.previous}>{set.previous ? describeSet(set.previous) : '—'}</span>
        {fields.map((field) => (
          <MetricInput
            aria-label={field.label}
            key={field.key}
            kind={field.kind}
            onChange={(value) => update({ [field.key]: value })}
            placeholder={set.previous?.[field.key] ?? null}
            value={set[field.key]}
          />
        ))}
        <button
          aria-label={set.done ? 'Mark set not done' : 'Complete set'}
          aria-pressed={set.done}
          className={css.check}
          onClick={toggleDone}
          type='button'
        >
          <CheckIcon aria-hidden='true' />
        </button>
      </ContextMenuTrigger>
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
                    <span className={css.menuBadge}>{type === 'normal' ? '1' : BADGE[type]}</span>
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
    </ContextMenuRoot>
  );
}
