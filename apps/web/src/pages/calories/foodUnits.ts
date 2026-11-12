import type { FoodProductUnit } from '@veles/db/seed/food-products';
import type { Localized } from '@/lib/i18n/locale';

/** Polish `genitive` is the singular genitive used after ½ and in "Waga 1 …". */
type UnitWords = {
  en: [one: string, other: string];
  pl: [one: string, few: string, genitive: string];
};

const unitWords: Record<FoodProductUnit, UnitWords> = {
  package: { en: ['package', 'packages'], pl: ['opakowanie', 'opakowania', 'opakowania'] },
  piece: { en: ['piece', 'pieces'], pl: ['sztuka', 'sztuki', 'sztuki'] },
  slice: { en: ['slice', 'slices'], pl: ['plaster', 'plastry', 'plastra'] },
  serving: { en: ['serving', 'servings'], pl: ['porcja', 'porcje', 'porcji'] },
};

export type FoodUnitShortcut = 0.5 | 1 | 2;

/** "½ piece", "1 piece", "2 pieces" with the Polish case each shortcut needs. */
export function foodUnitAmountText(unit: FoodProductUnit, amount: FoodUnitShortcut): Localized {
  const { en, pl } = unitWords[unit];
  if (amount === 0.5) return { en: `½ ${en[0]}`, pl: `½ ${pl[2]}` };
  if (amount === 1) return { en: `1 ${en[0]}`, pl: `1 ${pl[0]}` };
  return { en: `2 ${en[1]}`, pl: `2 ${pl[1]}` };
}

/** Unit picker labels, capitalized for the food editor. */
export const foodUnitOptions: { label: Localized; value: FoodProductUnit }[] = [
  { label: { en: 'Package', pl: 'Opakowanie' }, value: 'package' },
  { label: { en: 'Piece', pl: 'Sztuka' }, value: 'piece' },
  { label: { en: 'Slice', pl: 'Plaster' }, value: 'slice' },
  { label: { en: 'Serving', pl: 'Porcja' }, value: 'serving' },
];

/** Food editor label for the grams of one unit, e.g. "Weight of 1 piece (g)". */
export function foodUnitSizeLabel(unit: FoodProductUnit): Localized {
  const { en, pl } = unitWords[unit];
  return { en: `Weight of 1 ${en[0]} (g)`, pl: `Waga 1 ${pl[2]} (g)` };
}
