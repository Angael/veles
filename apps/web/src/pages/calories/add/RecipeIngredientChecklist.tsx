import { List, ListItem } from '@/components/ui/list/List';
import { ingredientNutrition, type RecipeIngredient } from '@/pages/recipes/recipeNutrition';
import { FoodSelectTarget } from '../FoodSelectTarget';
import { FoodSummary } from '../FoodSummary';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  checkedIds: string[];
  ingredients: RecipeIngredient[];
  onCheckedChange: (id: string, checked: boolean) => void;
  scale: number;
};

/** Recipe ingredients at the eaten amount, laid out like logged food rows; loggable ones tick. */
export function RecipeIngredientChecklist({
  checkedIds,
  ingredients,
  onCheckedChange,
  scale,
}: Props) {
  const { formatWhole, t } = useI18n();

  return (
    <List aria-label={t({ en: 'Ingredients to log', pl: 'Składniki do zapisania' })} data-selecting>
      {ingredients.map((ingredient) => {
        const nutrition = ingredientNutrition(ingredient, scale);
        const checked = nutrition !== null && checkedIds.includes(ingredient.id);

        return (
          <ListItem key={ingredient.id} selected={checked} style={{ padding: 0 }}>
            <FoodSummary
              carbs={nutrition?.carbs}
              category={ingredient.category}
              density='tight'
              fat={nutrition?.fat}
              imageUrl={ingredient.imageUrl}
              kcal={nutrition?.kcal}
              mediaOverlay={
                nutrition ? (
                  <FoodSelectTarget
                    checked={checked}
                    label={t({ en: `Log ${ingredient.name}`, pl: `Zapisz: ${ingredient.name}` })}
                    onCheckedChange={(next) => onCheckedChange(ingredient.id, next)}
                  />
                ) : null
              }
              meta={
                nutrition
                  ? `${formatWhole((ingredient.grams ?? 0) * scale)} g`
                  : t({
                      en: 'Not logged: no product or amount',
                      pl: 'Nie zapisywany: brak produktu lub ilości',
                    })
              }
              name={ingredient.name}
              protein={nutrition?.protein}
            />
          </ListItem>
        );
      })}
    </List>
  );
}
