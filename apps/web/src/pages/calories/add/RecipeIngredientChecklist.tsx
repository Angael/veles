import { List, ListItem } from '@/components/ui/list/List';
import {
  ingredientNutrition,
  isLoggableIngredient,
  type RecipeIngredient,
} from '@/pages/recipes/recipeNutrition';
import { FoodSelectTarget } from '../FoodSelectTarget';
import { FoodSummary } from '../FoodSummary';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  checkedIds: string[];
  ingredients: RecipeIngredient[];
  onCheckedChange: (id: string, checked: boolean) => void;
  scale: number;
};

/**
 * Recipe ingredients at the eaten amount, laid out like logged food rows. Only linked ones can be
 * ticked to be logged; custom ones are listed as not logged.
 */
export function RecipeIngredientChecklist({
  checkedIds,
  ingredients,
  onCheckedChange,
  scale,
}: Props) {
  const { formatNumber, t } = useI18n();

  return (
    <List aria-label={t({ en: 'Ingredients to log', pl: 'Składniki do zapisania' })} data-selecting>
      {ingredients.map((ingredient) => {
        const nutrition = ingredientNutrition(ingredient, scale);
        const checked = checkedIds.includes(ingredient.id);

        if (!isLoggableIngredient(ingredient) || !nutrition) {
          return (
            <ListItem key={ingredient.id} style={{ padding: 0 }}>
              <FoodSummary
                category={ingredient.category}
                density='compact'
                imageUrl={ingredient.imageUrl}
                meta={t({
                  en: 'Not logged: no product or amount',
                  pl: 'Nie zapisywany: brak produktu lub ilości',
                })}
                name={ingredient.name}
              />
            </ListItem>
          );
        }

        return (
          <ListItem key={ingredient.id} selected={checked} style={{ padding: 0 }}>
            <FoodSummary
              carbs={nutrition.carbs ?? 0}
              category={ingredient.category}
              density='compact'
              fat={nutrition.fat ?? 0}
              imageUrl={ingredient.imageUrl}
              kcal={nutrition.kcal}
              mediaOverlay={
                <FoodSelectTarget
                  checked={checked}
                  label={t({ en: `Log ${ingredient.name}`, pl: `Zapisz: ${ingredient.name}` })}
                  onCheckedChange={(next) => onCheckedChange(ingredient.id, next)}
                />
              }
              meta={`${formatNumber(Math.round(ingredient.grams * scale))} g`}
              name={ingredient.name}
              protein={nutrition.protein ?? 0}
            />
          </ListItem>
        );
      })}
    </List>
  );
}
