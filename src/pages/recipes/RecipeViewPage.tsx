import { type ReactNode, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, StarIcon, Trash2Icon } from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import type { RecipeLibraryItem } from './recipes.api';
import css from './RecipeViewPage.module.css';

type RecipeViewPageProps = {
  recipe: RecipeLibraryItem;
};

const MAX_RATING = 5;

export function RecipeViewPage({ recipe }: RecipeViewPageProps) {
  const canManageRecipe = true;
  const basePortions = Math.max(1, recipe.portions);
  const [imageIndex, setImageIndex] = useState(0);
  const [portions, setPortions] = useState(basePortions);
  const [visibleRating, setVisibleRating] = useState(recipe.rating ?? 0);
  const heroImage = recipe.images[imageIndex];
  const hasMultipleImages = recipe.images.length > 1;
  const nutritionScale = portions / basePortions;

  const showPreviousImage = () => {
    setImageIndex((current) => (current === 0 ? recipe.images.length - 1 : current - 1));
  };

  const showNextImage = () => {
    setImageIndex((current) => (current === recipe.images.length - 1 ? 0 : current + 1));
  };

  return (
    <main className={css.page}>
      <article className={css.recipe}>
        <header className={css.header}>
          <div>
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
        </header>

        <div className={css.hero}>
          {heroImage ? (
            <>
              <img
                alt=''
                aria-hidden='true'
                className={css.heroImageBackdrop}
                src={heroImage.url}
              />
              <div className={css.heroImageFrame}>
                <img alt='' className={css.heroImage} src={heroImage.url} />
              </div>
              {hasMultipleImages ? (
                <div className={css.carouselControls}>
                  <button
                    aria-label='Show previous recipe image'
                    className={css.carouselButton}
                    onClick={showPreviousImage}
                    type='button'
                  >
                    <ChevronLeftIcon aria-hidden='true' size={22} strokeWidth={2} />
                  </button>
                  <span className={css.imageCount}>
                    {imageIndex + 1}/{recipe.images.length}
                  </span>
                  <button
                    aria-label='Show next recipe image'
                    className={css.carouselButton}
                    onClick={showNextImage}
                    type='button'
                  >
                    <ChevronRightIcon aria-hidden='true' size={22} strokeWidth={2} />
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className={css.heroFallback}>No photo yet</div>
          )}
        </div>

        <div className={css.recipeTextGrid}>
          {recipe.description ? (
            <Card as='section' className={css.descriptionCard}>
              <p className={css.description}>{recipe.description}</p>
            </Card>
          ) : null}

          <Card as='aside' className={css.rightColumn}>
            {canManageRecipe ? (
              <div className={css.actions} aria-label='Recipe management actions'>
                <Btn
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
              <dl className={css.nutritionGrid}>
                <NutritionItem label='Portions' value={portions}>
                  <input
                    aria-label='Portions'
                    className={css.portionsInput}
                    min={1}
                    onChange={(event) =>
                      setPortions(Math.max(1, event.currentTarget.valueAsNumber || 1))
                    }
                    type='number'
                    value={portions}
                  />
                </NutritionItem>
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
  children,
  label,
  unit = '',
  value,
}: {
  children?: ReactNode;
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
      <dd>{children ?? `${formattedValue}${unit}`}</dd>
    </div>
  );
}
