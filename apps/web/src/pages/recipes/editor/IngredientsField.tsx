import { useQuery } from '@tanstack/react-query';
import { PlusIcon, TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';
import { calorieFoodsQueryOptions } from '@/pages/calories/calories.query';
import { Btn } from '@/components/ui/btn/Btn';
import { List } from '@/components/ui/list/List';
import { IngredientDialog } from './IngredientDialog';
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
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const editing = ingredients.find((ingredient) => ingredient.key === editingKey) ?? null;
  const unlinkedFromLogs = ingredients.filter(
    (ingredient) => ingredient.fromLogWithoutProduct && !ingredient.productId,
  ).length;

  /** Replaces the row with `key`, or removes it when `next` is null. */
  function update(key: string, next: IngredientDraft | null) {
    onChange(
      ingredients.flatMap((ingredient) => {
        if (ingredient.key !== key) return [ingredient];
        return next ? [next] : [];
      }),
    );
  }

  /** Closes the dialog and drops the row when nothing was picked or typed into it. */
  function closeDialog() {
    if (editing && !editing.name.trim() && !editing.productId) update(editing.key, null);
    setEditingKey(null);
  }

  function addIngredient() {
    const draft = ingredientDraft();
    onChange([...ingredients, draft]);
    setEditingKey(draft.key);
  }

  return (
    <fieldset className={css.field}>
      <legend>{t({ en: 'Ingredients', pl: 'Składniki' })}</legend>
      <p className={css.hint}>
        {t({
          en: 'Amounts are for the whole recipe.',
          pl: 'Ilości dotyczą całego przepisu.',
        })}
      </p>
      {unlinkedFromLogs ? (
        <p className={css.warning}>
          <TriangleAlertIcon aria-hidden='true' />
          {t({
            en: `Logged foods without a product: ${unlinkedFromLogs}. They add no kcal to the recipe. Open one to search or scan its product.`,
            pl: `Zapisane pozycje bez produktu: ${unlinkedFromLogs}. Nie dodają kcal do przepisu. Otwórz pozycję, aby wyszukać lub zeskanować produkt.`,
          })}
        </p>
      ) : null}
      <input
        name='ingredients'
        type='hidden'
        value={JSON.stringify(ingredientsToInput(ingredients))}
      />
      {ingredients.length ? (
        <List as='ol'>
          {ingredients.map((ingredient) => (
            <IngredientRow
              ingredient={ingredient}
              key={ingredient.key}
              onEdit={() => setEditingKey(ingredient.key)}
              onRemove={() => update(ingredient.key, null)}
              product={foods.find((food) => food.id === ingredient.productId)}
            />
          ))}
        </List>
      ) : null}
      <Btn
        className={css.add}
        icon={<PlusIcon aria-hidden='true' />}
        onClick={addIngredient}
        size='sm'
        type='button'
        variant='outlineMain'
      >
        {t({ en: 'Add ingredient', pl: 'Dodaj składnik' })}
      </Btn>
      <IngredientDialog
        foods={foods}
        ingredient={editing}
        onChange={(next) => update(next.key, next)}
        onClose={closeDialog}
      />
    </fieldset>
  );
}
