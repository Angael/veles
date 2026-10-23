import { BarcodeIcon, LinkIcon, PenLineIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import type { CalorieFood } from '@/pages/calories/calories.api';
import { foodProductNames } from '@/pages/calories/calorieHelpers';
import { filterFoods } from '@/pages/calories/add/filterFoods';
import { AutocompleteInput } from '@/components/ui/autocomplete-input/AutocompleteInput';
import { Btn } from '@/components/ui/btn/Btn';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { IngredientScanDialog } from './IngredientScanDialog';
import type { IngredientDraft } from './recipeDraft';
import css from './IngredientRow.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

const MAX_SUGGESTIONS = 8;

type Props = {
  foods: CalorieFood[];
  ingredient: IngredientDraft;
  onChange: (ingredient: IngredientDraft) => void;
  onRemove: () => void;
};

/** One ingredient: search or scan a product to link it, or keep typed text as a custom line. */
export function IngredientRow({ foods, ingredient, onChange, onRemove }: Props) {
  const { formatNumber, locale, t } = useI18n();
  const [scanning, setScanning] = useState(false);
  const product = ingredient.productId
    ? foods.find((food) => food.id === ingredient.productId)
    : undefined;
  const suggestions = filterFoods(foods, ingredient.name, MAX_SUGGESTIONS, locale);
  const productName = (food: CalorieFood) => t(foodProductNames(food));

  function link(food: CalorieFood) {
    onChange({
      ...ingredient,
      grams: ingredient.grams ?? food.productSizeGrams ?? 100,
      name: productName(food),
      productId: food.id,
    });
  }

  function linkedStatus() {
    if (!ingredient.grams)
      return t({
        en: 'Product · add grams to count it',
        pl: 'Produkt · podaj gramy, aby go liczyć',
      });
    if (!product) return t({ en: 'Product', pl: 'Produkt' });
    const kcal = formatNumber(Math.round((product.kcalPer100g * ingredient.grams) / 100));
    return t({ en: `Product · ${kcal} kcal`, pl: `Produkt · ${kcal} kcal` });
  }

  return (
    <li className={css.row}>
      <div className={css.inputs}>
        <div className={css.name}>
          <AutocompleteInput
            aria-label={t({ en: 'Ingredient', pl: 'Składnik' })}
            empty={t({
              en: 'No product found. The text stays a custom ingredient.',
              pl: 'Nie znaleziono produktu. Tekst zostanie własnym składnikiem.',
            })}
            itemKey={(food) => food.id}
            items={suggestions}
            itemToString={productName}
            onSelect={link}
            onValueChange={(name) => onChange({ ...ingredient, name, productId: null })}
            placeholder={t({ en: 'Search a product or type', pl: 'Szukaj produktu lub wpisz' })}
            renderItem={(food) => (
              <span className={css.suggestion}>
                <span>{productName(food)}</span>
                <small>{formatNumber(Math.round(food.kcalPer100g))} kcal / 100 g</small>
              </span>
            )}
            size='sm'
            value={ingredient.name}
          />
        </div>
        <NumberInput
          aria-label={t({ en: 'Grams', pl: 'Gramy' })}
          className={css.grams}
          min={0}
          onValueChange={(grams) => onChange({ ...ingredient, grams: grams || null })}
          placeholder='g'
          size='sm'
          value={ingredient.grams}
        />
        <Btn
          aria-label={t({ en: 'Scan barcode', pl: 'Skanuj kod kreskowy' })}
          icon={<BarcodeIcon aria-hidden='true' />}
          iconOnly
          onClick={() => setScanning(true)}
          size='sm'
          type='button'
          variant='ghost'
        />
        <Btn
          aria-label={t({ en: 'Remove ingredient', pl: 'Usuń składnik' })}
          icon={<Trash2Icon aria-hidden='true' />}
          iconOnly
          onClick={onRemove}
          size='sm'
          type='button'
          variant='ghostDanger'
        />
      </div>
      <p className={css.status} data-linked={ingredient.productId ? '' : undefined}>
        {ingredient.productId ? (
          <>
            <LinkIcon aria-hidden='true' />
            {linkedStatus()}
          </>
        ) : null}
        {!ingredient.productId && ingredient.name ? (
          <>
            <PenLineIcon aria-hidden='true' />
            {t({ en: 'Custom · not logged', pl: 'Własny · nie trafia do dziennika' })}
          </>
        ) : null}
      </p>
      <IngredientScanDialog
        onFound={(food) => {
          setScanning(false);
          link(food);
        }}
        onOpenChange={setScanning}
        open={scanning}
      />
    </li>
  );
}
