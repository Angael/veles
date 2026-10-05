import { Dialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, HistoryIcon, XIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { SET_TYPE_LABELS, type MockSet, type MockSlot } from '../mockData';
import { ScrubField } from '../scrub/ScrubField';
import { describeSet } from '../setShorthand';
import { completedPatch, formatMetric, MEASURE_FIELDS, parseMetric, scrubTuning } from './metrics';
import type { SessionActions } from './useMockSession';
import css from './SetSheet.module.css';

const WEIGHT_STEPS = [0.5, 1, 1.25, 2.5];

type SetSheetProps = {
  actions: SessionActions;
  onClose: () => void;
  onCompleted: (slot: MockSlot, set: MockSet) => void;
  onNavigate: (setId: string) => void;
  /** The set being edited; null closes the sheet. */
  target: { slot: MockSlot; setId: string } | null;
};

/**
 * Sheet that drops from the top (thumb stays on the list, keyboard never covers it). Big drag
 * fields with ± buttons, a per-exercise weight step, and ‹ › to walk through the sets.
 */
export function SetSheet({ actions, onClose, onCompleted, onNavigate, target }: SetSheetProps) {
  const slot = target?.slot;
  const index = slot?.sets.findIndex((set) => set.id === target?.setId) ?? -1;
  const set = slot?.sets[index];

  return (
    <Dialog.Root onOpenChange={(open) => !open && onClose()} open={Boolean(set)}>
      <Dialog.Portal>
        <Dialog.Backdrop className={css.backdrop} />
        <Dialog.Viewport className={css.viewport}>
          <Dialog.Popup className={css.sheet}>
            {slot && set ? (
              <>
                <header className={css.header}>
                  <Dialog.Title className={css.title}>{slot.name}</Dialog.Title>
                  <Dialog.Close
                    aria-label='Close'
                    render={
                      <Btn icon={<XIcon aria-hidden='true' />} iconOnly size='sm' variant='ghost' />
                    }
                  />
                </header>

                <nav aria-label='Sets' className={css.setNav}>
                  <button
                    aria-label='Previous set'
                    disabled={index <= 0}
                    onClick={() => onNavigate(slot.sets[index - 1]?.id ?? set.id)}
                    type='button'
                  >
                    <ChevronLeftIcon aria-hidden='true' />
                  </button>
                  <span>
                    Set {index + 1} of {slot.sets.length}
                    {set.type === 'normal' ? null : ` · ${SET_TYPE_LABELS[set.type]}`}
                    {set.done ? ' · done' : null}
                  </span>
                  <button
                    aria-label='Next set'
                    disabled={index >= slot.sets.length - 1}
                    onClick={() => onNavigate(slot.sets[index + 1]?.id ?? set.id)}
                    type='button'
                  >
                    <ChevronRightIcon aria-hidden='true' />
                  </button>
                </nav>

                {set.previous ? (
                  <button
                    className={css.previous}
                    onClick={() => actions.updateSet(slot.id, set.id, { ...set.previous })}
                    type='button'
                  >
                    <HistoryIcon aria-hidden='true' />
                    Last time {describeSet(set.previous)}
                    <span>use</span>
                  </button>
                ) : null}

                <div className={css.fields}>
                  {MEASURE_FIELDS[slot.measure].map((field) => (
                    <ScrubField
                      fallback={set.previous?.[field.key] ?? 0}
                      format={(value) => formatMetric(field, value)}
                      key={field.key}
                      label={field.label}
                      onChange={(value) =>
                        actions.updateSet(slot.id, set.id, { [field.key]: value })
                      }
                      parse={(text) => parseMetric(field, text)}
                      unit={field.unit}
                      value={set[field.key]}
                      {...scrubTuning(field, slot)}
                    />
                  ))}
                </div>

                {MEASURE_FIELDS[slot.measure].some((field) => field.key === 'weightKg') ? (
                  <div
                    aria-label='Weight step for this exercise'
                    className={css.steps}
                    role='radiogroup'
                  >
                    <span>Step</span>
                    {WEIGHT_STEPS.map((step) => (
                      <button
                        aria-checked={step === slot.weightStep}
                        className={clsx(step === slot.weightStep && css.stepActive)}
                        key={step}
                        onClick={() => actions.updateSlot(slot.id, { weightStep: step })}
                        role='radio'
                        type='button'
                      >
                        {step}
                      </button>
                    ))}
                  </div>
                ) : null}

                <Btn
                  className={css.done}
                  icon={<CheckIcon aria-hidden='true' />}
                  onClick={() => {
                    const patch = completedPatch(set, slot.measure);
                    actions.updateSet(slot.id, set.id, patch);
                    onCompleted(slot, { ...set, ...patch });
                    onClose();
                  }}
                  radius='pill'
                >
                  {set.done ? 'Save' : 'Done, start rest'}
                </Btn>
              </>
            ) : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
