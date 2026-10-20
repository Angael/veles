import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { macroPercentageTotal, type MacroPercentages } from './calorieGoalCalculator';
import css from './CalorieGoalsPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Localized } from '@/lib/i18n/locale';

const PRESETS: ReadonlyArray<{ label: Localized; values: MacroPercentages }> = [
  { label: { en: 'Balanced', pl: 'Zbalansowany' }, values: { protein: 25, fat: 30, carbs: 45 } },
  {
    label: { en: 'Higher protein', pl: 'Więcej białka' },
    values: { protein: 30, fat: 30, carbs: 40 },
  },
  {
    label: { en: 'Lower carb', pl: 'Mniej węglowodanów' },
    values: { protein: 30, fat: 40, carbs: 30 },
  },
];

type MacroPercentageEditorProps = {
  percentages: MacroPercentages;
  onChange: (percentages: MacroPercentages) => void;
};

/** Edits the calorie allocation and exposes neutral presets as understandable starting points. */
export function MacroPercentageEditor({ onChange, percentages }: MacroPercentageEditorProps) {
  const { formatNumber, t } = useI18n();
  const total = macroPercentageTotal(percentages);
  const hasValidTotal = Math.abs(total - 100) < 0.05;

  function update(field: keyof MacroPercentages, value: number | null) {
    onChange({ ...percentages, [field]: value ?? 0 });
  }

  return (
    <Card as='section' className={css.method}>
      <div className={css.methodHeading}>
        <h2>
          <span aria-hidden='true'>2.</span>{' '}
          {t({ en: 'Split calories into macros', pl: 'Podziel kalorie na makroskładniki' })}
        </h2>
      </div>

      <div
        aria-label={t({ en: 'Macro split presets', pl: 'Gotowe podziały makroskładników' })}
        className={css.presets}
      >
        {PRESETS.map((preset) => {
          const selected =
            preset.values.protein === percentages.protein &&
            preset.values.fat === percentages.fat &&
            preset.values.carbs === percentages.carbs;

          return (
            <Btn
              aria-pressed={selected}
              key={preset.label.en}
              onClick={() => onChange(preset.values)}
              size='sm'
              type='button'
              variant={selected ? 'main' : 'outlineMain'}
            >
              {t(preset.label)}
            </Btn>
          );
        })}
      </div>

      <div className={css.percentGrid}>
        <Label text={t({ en: 'Protein (%)', pl: 'Białko (%)' })}>
          <NumberInput
            max={100}
            min={0}
            onValueChange={(value) => update('protein', value)}
            value={percentages.protein}
          />
        </Label>
        <Label text={t({ en: 'Fat (%)', pl: 'Tłuszcz (%)' })}>
          <NumberInput
            max={100}
            min={0}
            onValueChange={(value) => update('fat', value)}
            value={percentages.fat}
          />
        </Label>
        <Label text={t({ en: 'Carbs (%)', pl: 'Węglowodany (%)' })}>
          <NumberInput
            max={100}
            min={0}
            onValueChange={(value) => update('carbs', value)}
            value={percentages.carbs}
          />
        </Label>
      </div>

      <p aria-live='polite' className={hasValidTotal ? css.validTotal : css.invalidTotal}>
        {t({ en: 'Total', pl: 'Suma' })}: {formatNumber(total, { maximumFractionDigits: 1 })}%
        {hasValidTotal ? '' : t({ en: ' — adjust to 100%', pl: ' — popraw do 100%' })}
      </p>
    </Card>
  );
}
