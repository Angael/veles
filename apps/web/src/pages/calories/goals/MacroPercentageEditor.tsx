import { Btn } from '@/components/btn/Btn';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { macroPercentageTotal, type MacroPercentages } from './calorieGoalCalculator';
import css from './CalorieGoalsPage.module.css';

const PRESETS: ReadonlyArray<{ label: string; values: MacroPercentages }> = [
  { label: 'Balanced', values: { protein: 25, fat: 30, carbs: 45 } },
  { label: 'Higher protein', values: { protein: 30, fat: 30, carbs: 40 } },
  { label: 'Lower carb', values: { protein: 30, fat: 40, carbs: 30 } },
];

type MacroPercentageEditorProps = {
  percentages: MacroPercentages;
  onChange: (percentages: MacroPercentages) => void;
};

/** Edits the calorie allocation and exposes neutral presets as understandable starting points. */
export function MacroPercentageEditor({ onChange, percentages }: MacroPercentageEditorProps) {
  const total = macroPercentageTotal(percentages);
  const hasValidTotal = Math.abs(total - 100) < 0.05;

  function update(field: keyof MacroPercentages, value: number | null) {
    onChange({ ...percentages, [field]: value ?? 0 });
  }

  return (
    <section className={css.method}>
      <div className={css.methodHeading}>
        <h2>
          <span aria-hidden='true'>2.</span> Split calories into macros
        </h2>
      </div>

      <div aria-label='Macro split presets' className={css.presets}>
        {PRESETS.map((preset) => {
          const selected =
            preset.values.protein === percentages.protein &&
            preset.values.fat === percentages.fat &&
            preset.values.carbs === percentages.carbs;

          return (
            <Btn
              aria-pressed={selected}
              key={preset.label}
              onClick={() => onChange(preset.values)}
              size='sm'
              type='button'
              variant={selected ? 'main' : 'outlineMain'}
            >
              {preset.label}
            </Btn>
          );
        })}
      </div>

      <div className={css.percentGrid}>
        <Label text='Protein (%)'>
          <NumberInput
            max={100}
            min={0}
            onValueChange={(value) => update('protein', value)}
            value={percentages.protein}
          />
        </Label>
        <Label text='Fat (%)'>
          <NumberInput
            max={100}
            min={0}
            onValueChange={(value) => update('fat', value)}
            value={percentages.fat}
          />
        </Label>
        <Label text='Carbs (%)'>
          <NumberInput
            max={100}
            min={0}
            onValueChange={(value) => update('carbs', value)}
            value={percentages.carbs}
          />
        </Label>
      </div>

      <p aria-live='polite' className={hasValidTotal ? css.validTotal : css.invalidTotal}>
        Total: {total.toFixed(1).replace('.0', '')}%{hasValidTotal ? '' : ' — adjust to 100%'}
      </p>
    </section>
  );
}
