import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { RecipeLibraryItem } from '../recipes.api';
import css from './RecipeViewPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type RecipeImgSliderProps = {
  images: RecipeLibraryItem['images'];
};

export function RecipeImgSlider({ images }: RecipeImgSliderProps) {
  const { t } = useI18n();
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
                aria-label={t({
                  en: 'Show previous recipe image',
                  pl: 'Poprzednie zdjęcie przepisu',
                })}
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
                aria-label={t({ en: 'Show next recipe image', pl: 'Następne zdjęcie przepisu' })}
                className={css.carouselButton}
                onClick={showNextImage}
                type='button'
              >
                <ChevronRightIcon aria-hidden='true' size={22} strokeWidth={2} />
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
