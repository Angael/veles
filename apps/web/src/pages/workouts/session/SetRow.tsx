import clsx from 'clsx';
import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { ContextMenuRoot, ContextMenuTrigger } from '@/components/ui/context-menu/ContextMenu';
import {
  DEFAULT_METRICS,
  filledFromPrevious,
  formatMetric,
  MEASURE_FIELDS,
  parseMetric,
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
import { useI18n } from '@/lib/i18n/I18nProvider';

type SetRowProps = {
  actions: SessionActions;
  finished: boolean;
  /** Working-set number; warm-ups and drops don't count, like Strong and Hevy. */
  number: number;
  onCompleted: (set: WorkoutSetData) => void;
  /** Opened by the tick when a cell has nothing to fill from; Save also finishes the set. */
  onOpenSheet: (complete: boolean) => void;
  set: WorkoutSetData;
  slot: WorkoutSlotData;
};

/**
 * One set as a spreadsheet-like row. Tap the badge to cycle the set type, tap the check to finish
 * it (empty cells adopt last time's values); everything else hides in the long-press menu.
 */
export function SetRow({
  actions,
  finished,
  number,
  onCompleted,
  onOpenSheet,
  set,
  slot,
}: SetRowProps) {
  const { locale, t } = useI18n();
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
        className={clsx(css.setRow, set.done && !finished && css.setDone)}
        data-fields={fields.length}
        data-finished={finished || undefined}
        render={<div role='row' />}
      >
        <button
          aria-label={t({
            en: `Set type: ${t(SET_TYPE_LABELS[set.type])}. Tap to change.`,
            pl: `Typ serii: ${t(SET_TYPE_LABELS[set.type])}. Dotknij, aby zmienić.`,
          })}
          className={clsx(css.badge, css[`badge_${set.type}`])}
          onClick={cycleType}
          type='button'
        >
          {set.type === 'normal' ? number : t(SET_BADGE[set.type])}
          {flash > 0 ? (
            <SetTypeFlash
              badge={set.type === 'normal' ? number : t(SET_BADGE[set.type])}
              key={flash}
              label={t(SET_TYPE_LABELS[set.type])}
              note={t(SET_TYPE_NOTES[set.type])}
              onDone={() => setFlash(0)}
            />
          ) : null}
        </button>
        {fields.map((field) => (
          <ScrubCell
            aria-label={t(field.label)}
            disabled={menuOpen}
            format={(value) => formatMetric(field, value, locale)}
            key={field.key}
            onChange={(value) => update({ [field.key]: value })}
            parse={(text) => parseMetric(field, text)}
            placeholder={set.previous?.[field.key] ?? DEFAULT_METRICS[field.key]}
            unit={field.cellUnit && t(field.cellUnit)}
            value={set[field.key]}
            {...scrubTuning(field)}
          />
        ))}
        {finished ? null : (
          <button
            aria-label={
              set.done
                ? t({ en: 'Mark set not done', pl: 'Oznacz serię jako niewykonaną' })
                : t({ en: 'Complete set', pl: 'Zakończ serię' })
            }
            aria-pressed={set.done}
            className={css.check}
            onClick={toggleDone}
            type='button'
          >
            <CheckIcon aria-hidden='true' />
          </button>
        )}
      </ContextMenuTrigger>
      <SetMenu actions={actions} set={set} update={update} />
    </ContextMenuRoot>
  );
}
