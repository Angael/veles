import { useEffect, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { StarIcon } from 'lucide-react';
import css from './RecipeRating.module.css';
import { useUpdateRecipeRatingMutation } from '../recipes.query';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';

type RecipeRatingProps = {
  rating: number | null;
  recipeId: string;
};

const MAX_RATING = 5;

export function RecipeRating({ rating, recipeId }: RecipeRatingProps) {
  const { t } = useI18n();
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
    }
  }

  return (
    <section className={css.rating} aria-label={t({ en: 'Owner rating', pl: 'Ocena właściciela' })}>
      <div aria-label={t({ en: 'Rating', pl: 'Ocena' })} className={css.stars} role='radiogroup'>
        {Array.from({ length: MAX_RATING }, (_, index) => {
          const ratingValue = index + 1;
          const isSelected = ratingValue <= visibleRating;
          const isCurrentRating = ratingValue === visibleRating;

          return (
            <button
              aria-label={t({
                en: `Rate ${ratingValue} ${pluralEn(ratingValue, 'star', 'stars')}`,
                pl: `Oceń na ${ratingValue} ${pluralPl(ratingValue, 'gwiazdkę', 'gwiazdki', 'gwiazdek')}`,
              })}
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
