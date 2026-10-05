import { useState } from 'react';
import { Card } from '@/components/ui/card/Card';
import { ScrubCell } from '../scrub/ScrubCell';
import { ScrubField } from '../scrub/ScrubField';
import { formatMetric, MEASURE_FIELDS, scrubTuning } from '../session/metrics';
import css from './Inputs.module.css';

const [weight, reps] = MEASURE_FIELDS.weight_reps;

/** The favourite: big drag fields where speed alone picks the step. */
export function DragFieldCard() {
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [repCount, setRepCount] = useState<number | null>(null);
  if (!weight || !reps) return null;
  return (
    <Card as='section' className={css.demo}>
      <h2>A. Drag</h2>
      <p className={css.hint}>
        Weight steps by speed: slow 0.5, then 1, 2.5, 5. On a phone, the number follows your finger
        like a ruler. Tap a number to type it.
      </p>
      <div className={css.fieldPair}>
        <ScrubField
          fallback={80}
          label={weight.label}
          onChange={setWeightKg}
          unit={weight.unit}
          value={weightKg}
          {...scrubTuning(weight)}
        />
        <ScrubField
          fallback={5}
          label={reps.label}
          onChange={setRepCount}
          unit={reps.unit}
          value={repCount}
          {...scrubTuning(reps)}
        />
      </div>
    </Card>
  );
}

type Row = { weightKg: number | null; reps: number | null };

/** The combo: tiny drag cells keep the whole workout on screen. */
export function DragCellsCard() {
  const [rows, setRows] = useState<Row[]>([
    { reps: null, weightKg: null },
    { reps: null, weightKg: null },
  ]);
  const update = (index: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  if (!weight || !reps) return null;
  return (
    <Card as='section' className={css.demo}>
      <h2>B. Drag cells</h2>
      <p className={css.hint}>
        Same gesture in small table cells. In the Live session tab, tapping a cell opens the sheet.
      </p>
      {rows.map((row, index) => (
        <div className={css.cellRow} key={index}>
          <span>{index + 1}</span>
          <ScrubCell
            aria-label={weight.label}
            format={(value) => formatMetric(weight, value)}
            onChange={(weightKg) => update(index, { weightKg })}
            placeholder={80}
            value={row.weightKg}
            {...scrubTuning(weight)}
          />
          <ScrubCell
            aria-label={reps.label}
            format={(value) => formatMetric(reps, value)}
            onChange={(value) => update(index, { reps: value })}
            placeholder={5}
            value={row.reps}
            {...scrubTuning(reps)}
          />
        </div>
      ))}
    </Card>
  );
}
