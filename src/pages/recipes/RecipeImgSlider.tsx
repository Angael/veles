import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { RecipeLibraryItem } from './recipes.api';
import css from './RecipeViewPage.module.css';

type RecipeImgSliderProps = {
  images: RecipeLibraryItem['images'];
};

export function RecipeImgSlider({ images }: RecipeImgSliderProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const heroImage = images[imageIndex];
  const hasMultipleImages = images.length > 1;

  const showPreviousImage = () => {
    setImageIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  };

  const showNextImage = () => {
    setImageIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  };

  return (
    <div className={css.hero}>
      {heroImage ? (
        <>
          <img alt='' aria-hidden='true' className={css.heroImageBackdrop} src={heroImage.url} />
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
                {imageIndex + 1}/{images.length}
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
  );
}
