import { BarcodeIcon } from 'lucide-react';
import { useState } from 'react';
import type { CalorieFood } from '@/pages/calories/calories.api';
import { foodProductNames } from '@/pages/calories/calorieHelpers';
import { filterFoods } from '@/pages/calories/add/filterFoods';
import { AutocompleteInput } from '@/components/ui/autocomplete-input/AutocompleteInput';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { ScrubCell } from '@/components/ui/scrub/ScrubCell';
import { IngredientScanDialog } from './IngredientScanDialog';
import type { IngredientDraft } from './recipeDraft';
import css from './IngredientDialog.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

const MAX_SUGGESTIONS = 8;
/** Slow drags move by 1 g, faster ones by 5, 10 and 50 g. */
const GRAM_TIERS = [
  { from: 0, step: 1 },
  { from: 0.3, step: 5 },
  { from: 0.65, step: 10 },
  { from: 1.1, step: 50 },
];

const parseGrams = (text: string) => {
  const value = Number(text.trim().replace(',', '.'));
  return text.trim() && Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
};

type Props = {
  foods: CalorieFood[];
  /** The ingredient being edited; null keeps the dialog closed. */
  ingredient: IngredientDraft | null;
  onChange: (ingredient: IngredientDraft) => void;
  onClose: () => void;
};

/** Edits one ingredient live: search or scan a product to link it, or keep typed text as custom. */
export function IngredientDialog({ foods, ingredient, onChange, onClose }: Props) {
  const { formatWhole, locale, t } = useI18n();
  const [scanning, setScanning] = useState(false);
  const productName = (food: CalorieFood) => t(foodProductNames(food));

  function link(food: CalorieFood) {
    if (!ingredient) return;
    onChange({
      ...ingredient,
      grams: ingredient.grams ?? food.productSizeGrams ?? 100,
      name: productName(food),
      productId: food.id,
    });
  }

  return (
    <DialogRoot onOpenChange={(open) => !open && onClose()} open={ingredient !== null}>
      <DialogPopup>
        <DialogTitle>{t({ en: 'Ingredient', pl: 'Składnik' })}</DialogTitle>
        {ingredient ? (
          <div className={css.fields}>
            <AutocompleteInput
              aria-label={t({ en: 'Ingredient', pl: 'Składnik' })}
              empty={t({
                en: 'No product found. The text stays a custom ingredient.',
                pl: 'Nie znaleziono produktu. Tekst zostanie własnym składnikiem.',
              })}
              itemKey={(food) => food.id}
              items={filterFoods(foods, ingredient.name, MAX_SUGGESTIONS, locale)}
              itemToString={productName}
              onSelect={link}
              onValueChange={(name) => onChange({ ...ingredient, name, productId: null })}
              placeholder={t({ en: 'Search a product or type', pl: 'Szukaj produktu lub wpisz' })}
              renderItem={(food) => (
                <span className={css.suggestion}>
                  <span>{productName(food)}</span>
                  <small>{formatWhole(food.kcalPer100g)} kcal / 100 g</small>
                </span>
              )}
              trailing={
                <Btn
                  aria-label={t({ en: 'Scan barcode', pl: 'Skanuj kod kreskowy' })}
                  icon={<BarcodeIcon aria-hidden='true' />}
                  iconOnly
                  onClick={() => setScanning(true)}
                  size='sm'
                  type='button'
                  variant='ghost'
                />
              }
              value={ingredient.name}
            />
            <div className={css.grams}>
              <ScrubCell
                aria-label={t({ en: 'Grams', pl: 'Gramy' })}
                format={(grams) => formatWhole(grams, { useGrouping: false })}
                max={20000}
                onChange={(grams) => onChange({ ...ingredient, grams: grams || null })}
                parse={parseGrams}
                placeholder={null}
                tiers={GRAM_TIERS}
                unit='g'
                value={ingredient.grams}
              />
            </div>
          </div>
        ) : null}
        <DialogActions>
          <DialogClose render={<Btn type='button' variant='main' />}>
            {t({ en: 'Done', pl: 'Gotowe' })}
          </DialogClose>
        </DialogActions>
        <IngredientScanDialog
          onFound={(food) => {
            setScanning(false);
            link(food);
          }}
          onOpenChange={setScanning}
          open={scanning}
        />
      </DialogPopup>
    </DialogRoot>
  );
}
