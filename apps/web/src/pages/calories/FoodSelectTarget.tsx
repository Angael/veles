import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import css from './FoodSelectTarget.module.css';

type Props = {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
};

/**
 * Checkbox covering a food image, so the image itself toggles selection. Hidden until hover or
 * checked; a `data-selecting` ancestor keeps every checkbox visible.
 */
export function FoodSelectTarget({ checked, label, onCheckedChange }: Props) {
  return (
    <label className={css.selectTarget}>
      <Checkbox
        aria-label={label}
        checked={checked}
        className={css.checkbox}
        onCheckedChange={onCheckedChange}
      />
    </label>
  );
}
