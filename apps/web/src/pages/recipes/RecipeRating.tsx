import { useEffect, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { StarIcon } from 'lucide-react';
import { toastManager } from '@/components/toast/toastManager';
import css from './RecipeRating.module.css';
import { useUpdateRecipeRatingMutation } from './recipes.query';

type RecipeRatingProps = {
  rating: number | null;
  recipeId: string;
};

const MAX_RATING = 5;

export function RecipeRating({ rating, recipeId }: RecipeRatingProps) {
  const router = useRouter();
  const [visibleRating, setVisibleRating] = useState(rating ?? 0);
  const ratingMutation = useUpdateRecipeRatingMutation();

  useEffect(() => {
    setVisibleRating(rating ?? 0);
  }, [rating]);

  async function rateRecipe(nextRating: number) {
    if (ratingMutation.isPending || nextRating === visibleRating) {
      return;
    }

    const previousRating = visibleRating;
    setVisibleRating(nextRating);

    try {
      await ratingMutation.mutateAsync({ data: { id: recipeId, rating: nextRating } });
      await router.invalidate();
    } catch {
      setVisibleRating(previousRating);
      toastManager.add({
        description: 'Your previous rating was restored. Please try again.',
        priority: 'high',
        title: 'Could not save rating',
        type: 'error',
      });
    }
  }

  return (
    <section className={css.rating} aria-label='Owner rating'>
      <div aria-label='Rating' className={css.stars} role='radiogroup'>
        {Array.from({ length: MAX_RATING }, (_, index) => {
          const ratingValue = index + 1;
          const isSelected = ratingValue <= visibleRating;
          const isCurrentRating = ratingValue === visibleRating;

          return (
            <button
              aria-label={`Rate ${ratingValue} ${ratingValue === 1 ? 'star' : 'stars'}`}
              aria-checked={isCurrentRating}
              className={css.starButton}
              disabled={ratingMutation.isPending}
              key={ratingValue}
              onClick={() => void rateRecipe(ratingValue)}
              role='radio'
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
