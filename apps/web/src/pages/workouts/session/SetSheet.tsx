import { Dialog } from '@base-ui/react/dialog';
import { HistoryIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import {
  describeSet,
  formatMetric,
  MEASURE_FIELDS,
  parseMetric,
  scrubTuning,
  type MetricKey,
} from '../metrics';
import { ScrubField } from '../scrub/ScrubField';
import type { WorkoutSetData, WorkoutSlotData } from '../workouts.server';
import css from './SetSheet.module.css';

type Draft = Partial<Record<MetricKey, number | null>>;

type SetSheetProps = {
  onClose: () => void;
  onSave: (patch: Draft) => void;
  /** The set being edited; null closes the sheet. */
  target: { slot: WorkoutSlotData; set: WorkoutSetData; number: number } | null;
};

/**
 * Helper for filling one set's values with big numbers. Drops from the top so the thumb and
 * keyboard never cover it. Edits a draft; nothing changes until Save.
 */
export function SetSheet({ onClose, onSave, target }: SetSheetProps) {
  const [draft, setDraft] = useState<Draft>({});
  const set = target?.set;
  useEffect(() => setDraft({}), [set?.id]);

  return (
    <Dialog.Root onOpenChange={(open) => !open && onClose()} open={Boolean(target)}>
      <Dialog.Portal>
        <Dialog.Backdrop className={css.backdrop} />
        <Dialog.Viewport className={css.viewport}>
          <Dialog.Popup className={css.sheet}>
            {target && set ? (
              <>
                <header className={css.header}>
                  <Dialog.Title className={css.title}>
                    {target.slot.name}
                    <small>Set {target.number}</small>
                  </Dialog.Title>
                  <Dialog.Close
                    aria-label='Close'
                    render={
                      <Btn icon={<XIcon aria-hidden='true' />} iconOnly size='sm' variant='ghost' />
                    }
                  />
                </header>

                {set.previous ? (
                  <button
                    className={css.previous}
                    onClick={() => setDraft({ ...set.previous })}
                    type='button'
                  >
                    <HistoryIcon aria-hidden='true' />
                    Last time {describeSet(set.previous)}
                    <span>use</span>
                  </button>
                ) : null}

                <div className={css.fields}>
                  {MEASURE_FIELDS[target.slot.measure].map((field) => (
                    <ScrubField
                      fallback={set.previous?.[field.key] ?? 0}
                      format={(value) => formatMetric(field, value)}
                      key={field.key}
                      label={field.label}
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, [field.key]: value }))
                      }
                      parse={(text) => parseMetric(field, text)}
                      unit={field.unit}
                      value={field.key in draft ? (draft[field.key] ?? null) : set[field.key]}
                      {...scrubTuning(field)}
                    />
                  ))}
                </div>

                <Btn
                  onClick={() => {
                    onSave(draft);
                    onClose();
                  }}
                  radius='pill'
                >
                  Save
                </Btn>
              </>
            ) : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
