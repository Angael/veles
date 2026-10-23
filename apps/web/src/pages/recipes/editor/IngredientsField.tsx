import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { calorieFoodsQueryOptions } from '@/pages/calories/calories.query';
import { Btn } from '@/components/ui/btn/Btn';
import { IngredientRow } from './IngredientRow';
import { ingredientDraft, ingredientsToInput, type IngredientDraft } from './recipeDraft';
import css from './IngredientsField.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  ingredients: IngredientDraft[];
  onChange: (ingredients: IngredientDraft[]) => void;
};

/** Ingredient rows for the whole recipe, sent to the server as one JSON form field. */
export function IngredientsField({ ingredients, onChange }: Props) {
  const { t } = useI18n();
  const foodsQuery = useQuery(calorieFoodsQueryOptions());
  const foods = foodsQuery.data ?? [];

  /** Replaces the row with `key`, or removes it when `next` is null. */
  function update(key: string, next: IngredientDraft | null) {
    onChange(
      ingredients.flatMap((ingredient) => {
        if (ingredient.key !== key) return [ingredient];
        return next ? [next] : [];
      }),
    );
  }

  return (
    <fieldset className={css.field}>
      <legend>{t({ en: 'Ingredients', pl: 'Składniki' })}</legend>
      <p className={css.hint}>
        {t({
          en: 'Amounts are for the whole recipe. Only ingredients linked to a product are added to the food log.',
          pl: 'Ilości dotyczą całego przepisu. Do dziennika trafiają tylko składniki powiązane z produktem.',
        })}
      </p>
      <input
        name='ingredients'
        type='hidden'
        value={JSON.stringify(ingredientsToInput(ingredients))}
      />
      <ol className={css.rows}>
        {ingredients.map((ingredient) => (
          <IngredientRow
            foods={foods}
            ingredient={ingredient}
            key={ingredient.key}
            onChange={(next) => update(ingredient.key, next)}
            onRemove={() => update(ingredient.key, null)}
          />
        ))}
      </ol>
      <Btn
        className={css.add}
        icon={<PlusIcon aria-hidden='true' />}
        onClick={() => onChange([...ingredients, ingredientDraft()])}
        size='sm'
        type='button'
        variant='outlineMain'
      >
        {t({ en: 'Add ingredient', pl: 'Dodaj składnik' })}
      </Btn>
    </fieldset>
  );
}
