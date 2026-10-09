import clsx from 'clsx';
import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { ContextMenuRoot, ContextMenuTrigger } from '@/components/ui/context-menu/ContextMenu';
import {
  DEFAULT_METRICS,
  filledFromPrevious,
  formatMetric,
  MEASURE_FIELDS,
  scrubTuning,
  SET_BADGE,
  SET_TYPE_LABELS,
  SET_TYPE_NOTES,
  SET_TYPES,
} from '../metrics';
import { ScrubCell } from '../scrub/ScrubCell';
import type { WorkoutSetData, WorkoutSlotData } from '../workouts.server';
import type { SessionActions, SetPatch } from './session.query';
import { SetMenu } from './SetMenu';
import { SetTypeFlash } from './SetTypeFlash';
import css from './Session.module.css';

type SetRowProps = {
  actions: SessionActions;
  /** Working-set number; warm-ups and drops don't count, like Strong and Hevy. */
  number: number;
  onCompleted: (set: WorkoutSetData) => void;
  /** `complete`: the tick opened the sheet, so Save also finishes the set. */
  onOpenSheet: (complete?: boolean) => void;
  set: WorkoutSetData;
  slot: WorkoutSlotData;
};

/**
 * One set as a spreadsheet-like row. Tap the badge to cycle the set type, tap the check to finish
 * it (empty cells adopt last time's values); everything else hides in the long-press menu.
 */
export function SetRow({ actions, number, onCompleted, onOpenSheet, set, slot }: SetRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  /** Bumped on every badge tap so the type label replays its animation. */
  const [flash, setFlash] = useState(0);
  const fields = MEASURE_FIELDS[slot.measure];
  const update = (patch: SetPatch) => actions.updateSet(set.id, patch);

  function toggleDone() {
    if (set.done) return update({ done: false });
    const filled = filledFromPrevious(set, slot.measure);
    if (!filled) return onOpenSheet(true);
    const patch = { ...filled, done: true };
    update(patch);
    onCompleted({ ...set, ...patch });
  }

  function cycleType() {
    const next = SET_TYPES[(SET_TYPES.indexOf(set.type) + 1) % SET_TYPES.length];
    update({ type: next ?? 'normal' });
    setFlash((count) => count + 1);
  }

  return (
    <ContextMenuRoot onOpenChange={setMenuOpen}>
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
          {set.type === 'normal' ? number : SET_BADGE[set.type]}
          {flash > 0 ? (
            <SetTypeFlash
              badge={set.type === 'normal' ? number : SET_BADGE[set.type]}
              key={flash}
              label={SET_TYPE_LABELS[set.type]}
              note={SET_TYPE_NOTES[set.type]}
              onDone={() => setFlash(0)}
            />
          ) : null}
        </button>
        {fields.map((field) => (
          <ScrubCell
            aria-label={`${field.label}, drag sideways or tap for details`}
            disabled={menuOpen}
            format={(value) => formatMetric(field, value)}
            key={field.key}
            onChange={(value) => update({ [field.key]: value })}
            onTap={() => onOpenSheet()}
            placeholder={set.previous?.[field.key] ?? DEFAULT_METRICS[field.key]}
            unit={field.cellUnit}
            value={set[field.key]}
            {...scrubTuning(field)}
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
      <SetMenu actions={actions} set={set} update={update} />
    </ContextMenuRoot>
  );
}
