import clsx from 'clsx';
import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { ContextMenuRoot, ContextMenuTrigger } from '@/components/ui/context-menu/ContextMenu';
import { SET_TYPE_LABELS, type MockSet, type MockSlot } from '../mockData';
import { ScrubCell } from '../scrub/ScrubCell';
import { MetricInput } from './MetricInput';
import { completedPatch, formatMetric, MEASURE_FIELDS, scrubTuning } from './metrics';
import { SET_BADGE, SET_TYPE_ORDER, SetMenu } from './SetMenu';
import type { SessionActions } from './useMockSession';
import css from './Session.module.css';

/** `drag`: cells scrub sideways and tap opens the set sheet. `type`: plain inputs. */
export type CellMode = 'drag' | 'type';

type SetRowProps = {
  actions: SessionActions;
  cellMode: CellMode;
  /** Working-set number; warm-ups and drops don't count, like Strong and Hevy. */
  number: number;
  onCompleted: (set: MockSet) => void;
  onOpenSheet: () => void;
  set: MockSet;
  slot: MockSlot;
};

/**
 * One set as a spreadsheet-like row. Tap the badge to cycle the set type, tap the check to finish
 * it (empty cells adopt last time's values); everything else hides in the long-press menu.
 */
export function SetRow({
  actions,
  cellMode,
  number,
  onCompleted,
  onOpenSheet,
  set,
  slot,
}: SetRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const fields = MEASURE_FIELDS[slot.measure];
  const update = (patch: Partial<MockSet>) => actions.updateSet(slot.id, set.id, patch);

  function toggleDone() {
    if (set.done) return update({ done: false });
    const patch = completedPatch(set, slot.measure);
    update(patch);
    onCompleted({ ...set, ...patch });
  }

  function cycleType() {
    const next = SET_TYPE_ORDER[(SET_TYPE_ORDER.indexOf(set.type) + 1) % SET_TYPE_ORDER.length];
    update({ type: next ?? 'normal' });
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
        </button>
        {fields.map((field) =>
          cellMode === 'drag' ? (
            <ScrubCell
              aria-label={`${field.label}, drag sideways or tap for details`}
              disabled={menuOpen}
              format={(value) => formatMetric(field, value)}
              key={field.key}
              onChange={(value) => update({ [field.key]: value })}
              onTap={onOpenSheet}
              placeholder={set.previous?.[field.key] ?? null}
              value={set[field.key]}
              {...scrubTuning(field)}
            />
          ) : (
            <MetricInput
              field={field}
              key={field.key}
              onChange={(value) => update({ [field.key]: value })}
              placeholder={set.previous?.[field.key] ?? null}
              value={set[field.key]}
            />
          ),
        )}
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
      <SetMenu actions={actions} set={set} slot={slot} update={update} />
    </ContextMenuRoot>
  );
}
