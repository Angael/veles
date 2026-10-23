import { SliderInput } from '@/components/ui/slider-input/SliderInput';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  className?: string;
  label: string;
  onValueChange: (portions: number) => void;
  /** The recipe's own portions, which its ingredient amounts are for. */
  recipePortions: number;
  value: number;
};

/** Half-portion slider for a recipe, with a reset to the whole recipe. */
export function RecipePortionSlider({
  className,
  label,
  onValueChange,
  recipePortions,
  value,
}: Props) {
  const { formatNumber, t } = useI18n();
  return (
    <SliderInput
      className={className}
      label={label}
      max={Math.max(8, recipePortions, value)}
      min={0.5}
      onValueChange={onValueChange}
      reset={{
        label: t({
          en: `Reset to whole recipe (${formatNumber(recipePortions)})`,
          pl: `Przywróć cały przepis (${formatNumber(recipePortions)})`,
        }),
        value: recipePortions,
      }}
      step={0.5}
      value={value}
    />
  );
}
