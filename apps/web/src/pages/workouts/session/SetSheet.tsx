import { HistoryIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { DialogClose, DialogPopup, DialogRoot, DialogTitle } from '@/components/ui/dialog/Dialog';
import {
  DEFAULT_METRICS,
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
import { useI18n } from '@/lib/i18n/I18nProvider';

type Draft = Partial<Record<MetricKey, number | null>>;

type SetSheetProps = {
  onClose: () => void;
  onSave: (patch: Draft) => void;
  /** The set being edited; null closes the sheet. */
  target: { slot: WorkoutSlotData; set: WorkoutSetData; number: number } | null;
};

/**
 * Helper for filling one set's values with big numbers. Edits a draft; nothing changes until Save.
 */
export function SetSheet({ onClose, onSave, target }: SetSheetProps) {
  const { locale, t } = useI18n();
  const [draft, setDraft] = useState<Draft>({});
  const set = target?.set;
  useEffect(() => setDraft({}), [set?.id]);

  return (
    <DialogRoot onOpenChange={(open) => !open && onClose()} open={Boolean(target)}>
      <DialogPopup className={css.sheet}>
        {target && set ? (
          <>
            <header className={css.header}>
              <DialogTitle className={css.title}>
                {target.slot.name}
                <small>{t({ en: `Set ${target.number}`, pl: `Seria ${target.number}` })}</small>
              </DialogTitle>
              <DialogClose
                aria-label={t({ en: 'Close', pl: 'Zamknij' })}
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
                {t({ en: 'Last time', pl: 'Ostatnio' })} {describeSet(set.previous, locale)}
                <span>{t({ en: 'use', pl: 'użyj' })}</span>
              </button>
            ) : null}

            <div className={css.fields}>
              {MEASURE_FIELDS[target.slot.measure].map((field) => (
                <ScrubField
                  fallback={set.previous?.[field.key] ?? DEFAULT_METRICS[field.key]}
                  format={(value) => formatMetric(field, value, locale)}
                  key={field.key}
                  label={t(field.label)}
                  onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
                  parse={(text) => parseMetric(field, text)}
                  unit={t(field.unit)}
                  value={field.key in draft ? (draft[field.key] ?? null) : set[field.key]}
                  {...scrubTuning(field)}
                />
              ))}
            </div>

            <Btn
              onClick={() => {
                // Empty fields save what the sheet shows, so Save always logs visible values.
                const shown = Object.fromEntries(
                  MEASURE_FIELDS[target.slot.measure].map((field) => [
                    field.key,
                    draft[field.key] ??
                      set[field.key] ??
                      set.previous?.[field.key] ??
                      DEFAULT_METRICS[field.key],
                  ]),
                );
                onSave(shown);
                onClose();
              }}
              radius='pill'
            >
              {t({ en: 'Save', pl: 'Zapisz' })}
            </Btn>
          </>
        ) : null}
      </DialogPopup>
    </DialogRoot>
  );
}
