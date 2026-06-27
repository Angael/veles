import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { PencilIcon, StarIcon, Trash2Icon } from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { RecipeImgSlider } from './RecipeImgSlider';
import type { RecipeLibraryItem } from './recipes.api';
import css from './RecipeViewPage.module.css';

type RecipeViewPageProps = {
  recipe: RecipeLibraryItem;
};

const MAX_RATING = 5;

export function RecipeViewPage({ recipe }: RecipeViewPageProps) {
  const canManageRecipe = true;
  const basePortions = Math.max(1, recipe.portions);
  const [portions, setPortions] = useState(basePortions);
  const [visibleRating, setVisibleRating] = useState(recipe.rating ?? 0);
  const nutritionScale = portions / basePortions;

  return (
    <main className={css.page}>
      <article className={css.recipe}>
        <RecipeImgSlider images={recipe.images} />

        <div className={css.recipeTextGrid}>
          <Card as='section' className={css.descriptionCard}>
            <div className={css.descriptionHeader}>
              <h1>{recipe.name}</h1>

              {recipe.tags.length > 0 ? (
                <div className={css.tags} aria-label='Recipe tags'>
                  {recipe.tags.map((tag) => (
                    <span className={css.tag} key={tag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {recipe.description ? <p className={css.description}>{recipe.description}</p> : null}
          </Card>

          <Card as='aside' className={css.rightColumn}>
            <section className={css.rating} aria-label='Owner rating'>
              <div className={css.stars}>
                {Array.from({ length: MAX_RATING }, (_, index) => {
                  const ratingValue = index + 1;
                  const isSelected = ratingValue <= visibleRating;

                  return (
                    <button
                      aria-label={`Rate ${ratingValue} ${ratingValue === 1 ? 'star' : 'stars'}`}
                      aria-pressed={isSelected}
                      className={css.starButton}
                      key={ratingValue}
                      onClick={() => setVisibleRating(ratingValue)}
                      type='button'
                    >
                      <StarIcon
                        aria-hidden='true'
                        className={isSelected ? css.starSelected : css.star}
                        fill={isSelected ? 'currentColor' : 'none'}
                        size={24}
                        strokeWidth={1.8}
                      />
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={css.ingredients}>
              <h2>Ingredients</h2>
              <ul className={css.ingredientList}>
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient}>{ingredient}</li>
                ))}
              </ul>
            </section>

            <section className={css.nutrition} aria-labelledby='nutrition-heading'>
              <h2 id='nutrition-heading'>Nutrition</h2>
              <Label text='Portions'>
                <NumberInput
                  className={css.portionsInput}
                  min={0.5}
                  step={0.5}
                  onValueChange={(value) => setPortions(Math.max(0.5, value ?? 1))}
                  value={portions}
                />
              </Label>
              <dl className={css.nutritionGrid}>
                <NutritionItem label='Kcal' value={scaleNutrition(recipe.kcal, nutritionScale)} />
                <NutritionItem
                  label='Protein'
                  unit='g'
                  value={scaleNutrition(recipe.protein, nutritionScale)}
                />
                <NutritionItem
                  label='Carbs'
                  unit='g'
                  value={scaleNutrition(recipe.carbs, nutritionScale)}
                />
                <NutritionItem
                  label='Fats'
                  unit='g'
                  value={scaleNutrition(recipe.fats, nutritionScale)}
                />
              </dl>
            </section>

            {canManageRecipe ? (
              <div className={css.actions} aria-label='Recipe management actions'>
                <Btn
                  className={css.actionButton}
                  icon={<PencilIcon aria-hidden='true' size={16} strokeWidth={1.9} />}
                  isLink
                  radius='pill'
                  render={<Link params={{ id: recipe.id }} to='/recipes/view/$id/edit' />}
                  size='sm'
                  variant='outlineMain'
                >
                  Edit
                </Btn>
                <Btn
                  className={css.actionButton}
                  icon={<Trash2Icon aria-hidden='true' size={16} strokeWidth={1.9} />}
                  onClick={() => window.confirm('Delete this recipe?')}
                  radius='pill'
                  size='sm'
                  type='button'
                  variant='outlineDanger'
                >
                  Delete
                </Btn>
              </div>
            ) : null}
          </Card>
        </div>
      </article>
    </main>
  );
}

function scaleNutrition(value: number | null, scale: number) {
  return value === null ? null : value * scale;
}

function NutritionItem({
  label,
  unit = '',
  value,
}: {
  label: string;
  unit?: string;
  value: number | null;
}) {
  if (value === null) {
    return null;
  }

  const formattedValue = Number.isInteger(value) ? value : Number(value.toFixed(1));

  return (
    <div className={css.nutritionItem}>
      <dt>{label}</dt>
      <dd>
        {formattedValue}
        {unit}
      </dd>
    </div>
  );
}
