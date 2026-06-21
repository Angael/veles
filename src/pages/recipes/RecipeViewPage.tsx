import { Link } from '@tanstack/react-router';
import { PencilIcon, StarIcon, Trash2Icon } from 'lucide-react';
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
  const heroImage = recipe.images[0];
  const visibleRating = recipe.rating ?? 0;

  return (
    <main className={css.page}>
      <article className={css.recipe}>
        <div className={css.hero}>
          {heroImage ? (
            <img alt='' className={css.heroImage} src={heroImage.url} />
          ) : (
            <div className={css.heroFallback}>No photo yet</div>
          )}
        </div>

        <div className={css.body}>
          <header className={css.header}>
            <div className={css.titleBlock}>
              <h1>{recipe.name}</h1>
              {recipe.description ? <p>{recipe.description}</p> : null}
            </div>

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
                  radius='pill'
                  size='sm'
                  type='button'
                  variant='outlineDanger'
                >
                  Delete
                </Btn>
              </div>
            ) : null}
          </header>

          <section className={css.rating} aria-label='Owner rating'>
            <span>Owner rating</span>
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
                    disabled
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

          <div className={css.contentGrid}>
            <Card as='section' className={css.panel}>
              <h2>Ingredients</h2>
              <ul className={css.ingredientList}>
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient}>{ingredient}</li>
                ))}
              </ul>
            </Card>

            <Card as='section' className={css.panel}>
              <h2>Nutrition</h2>
              <dl className={css.nutritionGrid}>
                <NutritionItem label='Kcal' value={recipe.kcal} />
                <NutritionItem label='Protein' value={recipe.protein} unit='g' />
                <NutritionItem label='Carbs' value={recipe.carbs} unit='g' />
                <NutritionItem label='Fats' value={recipe.fats} unit='g' />
              </dl>
            </Card>
          </div>

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
      </article>
    </main>
  );
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
  return (
    <div className={css.nutritionItem}>
      <dt>{label}</dt>
      <dd>{value === null ? 'Unknown' : `${value}${unit}`}</dd>
    </div>
  );
}
