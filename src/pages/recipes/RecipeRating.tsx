import { useEffect, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { StarIcon } from 'lucide-react';
import { toastManager } from '@/components/toast/toastManager';
import { updateRecipeRating } from './recipes.api';
import css from './RecipeRating.module.css';

type RecipeRatingProps = {
  rating: number | null;
  recipeId: string;
};

const MAX_RATING = 5;

export function RecipeRating({ rating, recipeId }: RecipeRatingProps) {
  const router = useRouter();
  const [visibleRating, setVisibleRating] = useState(rating ?? 0);
  const [savingRating, setSavingRating] = useState(false);

  useEffect(() => {
    setVisibleRating(rating ?? 0);
  }, [rating]);

  async function rateRecipe(nextRating: number) {
    if (savingRating || nextRating === visibleRating) {
      return;
    }

    const previousRating = visibleRating;
    setVisibleRating(nextRating);
    setSavingRating(true);

    try {
      await updateRecipeRating({ data: { id: recipeId, rating: nextRating } });
      await router.invalidate();
    } catch {
      setVisibleRating(previousRating);
      toastManager.add({
        description: 'Your previous rating was restored. Please try again.',
        priority: 'high',
        title: 'Could not save rating',
        type: 'error',
      });
    } finally {
      setSavingRating(false);
    }
  }

  return (
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
              disabled={savingRating}
              key={ratingValue}
              onClick={() => void rateRecipe(ratingValue)}
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
  );
}
