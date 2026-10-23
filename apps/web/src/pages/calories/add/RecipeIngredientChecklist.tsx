import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import { List, ListItem } from '@/components/ui/list/List';
import {
  ingredientNutrition,
  isLoggableIngredient,
  type RecipeIngredient,
} from '@/pages/recipes/recipeNutrition';
import { NutritionInline } from '../NutritionInline';
import css from './RecipeLogForm.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  checkedIds: string[];
  ingredients: RecipeIngredient[];
  onCheckedChange: (id: string, checked: boolean) => void;
  scale: number;
};

/** Recipe ingredients at the eaten amount; only linked ones can be ticked to be logged. */
export function RecipeIngredientChecklist({
  checkedIds,
  ingredients,
  onCheckedChange,
  scale,
}: Props) {
  const { formatNumber, t } = useI18n();

  return (
    <List aria-label={t({ en: 'Ingredients to log', pl: 'Składniki do zapisania' })}>
      {ingredients.map((ingredient) => {
        const nutrition = ingredientNutrition(ingredient, scale);
        const loggable = isLoggableIngredient(ingredient);
        const grams =
          ingredient.grams === null
            ? null
            : `${formatNumber(ingredient.grams * scale, { maximumFractionDigits: 0 })} g`;

        return (
          <ListItem interactive={loggable} key={ingredient.id}>
            <label className={css.ingredient} data-disabled={loggable ? undefined : ''}>
              <Checkbox
                checked={loggable && checkedIds.includes(ingredient.id)}
                disabled={!loggable}
                onCheckedChange={(checked) => onCheckedChange(ingredient.id, checked)}
              />
              <span className={css.ingredientName}>
                <strong>{ingredient.name}</strong>
                <small>
                  {loggable
                    ? grams
                    : t({
                        en: 'Not logged: no product or amount',
                        pl: 'Nie zapisywany: brak produktu lub ilości',
                      })}
                </small>
              </span>
              {nutrition ? (
                <NutritionInline
                  carbs={nutrition.carbs ?? 0}
                  fat={nutrition.fat ?? 0}
                  kcal={nutrition.kcal}
                  protein={nutrition.protein ?? 0}
                  stacked
                />
              ) : null}
            </label>
          </ListItem>
        );
      })}
    </List>
  );
}
