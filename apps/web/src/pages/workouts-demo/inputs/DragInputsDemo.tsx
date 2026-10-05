import clsx from 'clsx';
import { useState } from 'react';
import { Card } from '@/components/ui/card/Card';
import { ScrubCell } from '../scrub/ScrubCell';
import { ScrubField } from '../scrub/ScrubField';
import css from './Inputs.module.css';

const STEPS = [1, 2.5];

/** The favourite: big drag fields with live speed → precision feedback. */
export function DragFieldCard() {
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [reps, setReps] = useState<number | null>(null);
  const [step, setStep] = useState(2.5);
  return (
    <Card as='section' className={css.demo}>
      <h2>A. Drag, accelerated</h2>
      <p className={css.hint}>
        Drag slowly for single steps, flick for big jumps (snaps to {Math.max(2.5, step * 2)}). The
        bar shows your speed. Tap the number to type, or use − / +.
      </p>
      <div className={css.stepPicker} role='radiogroup' aria-label='Weight step'>
        {STEPS.map((option) => (
          <button
            aria-checked={option === step}
            className={clsx(option === step && css.stepActive)}
            key={option}
            onClick={() => setStep(option)}
            role='radio'
            type='button'
          >
            {option === 1 ? 'Dumbbells · 1 kg' : 'Barbell · 2.5 kg'}
          </button>
        ))}
      </div>
      <ScrubField
        coarseStep={Math.max(2.5, step * 2)}
        fallback={step === 1 ? 6 : 80}
        label='Weight'
        onChange={setWeightKg}
        step={step}
        unit='kg'
        value={weightKg}
      />
      <ScrubField
        coarseStep={5}
        fallback={5}
        label='Reps'
        onChange={setReps}
        step={1}
        unit='reps'
        value={reps}
      />
    </Card>
  );
}

/** The combo: tiny drag cells keep the whole workout on screen. */
export function DragCellsCard() {
  const [rows, setRows] = useState([
    { reps: null as number | null, weightKg: null as number | null },
    { reps: null as number | null, weightKg: null as number | null },
  ]);
  const update = (index: number, patch: Partial<(typeof rows)[number]>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <Card as='section' className={css.demo}>
      <h2>B. Drag cells (combo)</h2>
      <p className={css.hint}>
        Same gesture inside small table cells. Tapping a cell opens the big top sheet; try it in the
        Live session tab.
      </p>
      {rows.map((row, index) => (
        <div className={css.cellRow} key={index}>
          <span>{index + 1}</span>
          <ScrubCell
            aria-label='Weight'
            coarseStep={5}
            format={String}
            onChange={(weightKg) => update(index, { weightKg })}
            placeholder={80}
            step={2.5}
            value={row.weightKg}
          />
          <ScrubCell
            aria-label='Reps'
            coarseStep={5}
            format={String}
            onChange={(reps) => update(index, { reps })}
            placeholder={5}
            step={1}
            value={row.reps}
          />
        </div>
      ))}
    </Card>
  );
}
