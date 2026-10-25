import { Link } from '@tanstack/react-router';
import { LinkIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { RecipeImgSlider } from './RecipeImgSlider';
import { RecipeNutrition } from './RecipeNutrition';
import { RecipeRating } from './RecipeRating';
import type { RecipeLibraryItem } from '../recipes.api';
import css from './RecipeViewPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type RecipeViewPageProps = {
  recipe: RecipeLibraryItem;
};

export function RecipeViewPage({ recipe }: RecipeViewPageProps) {
  const { formatWhole, t } = useI18n();
  const [portions, setPortions] = useState(recipe.portions);
  const scale = portions / recipe.portions;

  return (
    <main className={css.page}>
      <article className={css.recipe}>
        <header className={css.heading}>
          <div className={css.identity}>
            <h1>{recipe.name}</h1>
          </div>

          <div
            className={css.actions}
            aria-label={t({ en: 'Recipe management actions', pl: 'Zarządzanie przepisem' })}
            role='group'
          >
            <Btn
              className={css.actionButton}
              icon={<PencilIcon aria-hidden='true' size={16} strokeWidth={1.9} />}
              isLink
              radius='pill'
              render={<Link params={{ id: recipe.id }} to='/recipes/view/$id/edit' />}
              size='sm'
              variant='outlineMain'
            >
              {t({ en: 'Edit', pl: 'Edytuj' })}
            </Btn>
            {recipe.isOwned ? (
              <Btn
                className={css.actionButton}
                icon={<Trash2Icon aria-hidden='true' size={16} strokeWidth={1.9} />}
                onClick={() =>
                  window.confirm(t({ en: 'Delete this recipe?', pl: 'Usunąć ten przepis?' }))
                }
                radius='pill'
                size='sm'
                type='button'
                variant='outlineDanger'
              >
                {t({ en: 'Delete', pl: 'Usuń' })}
              </Btn>
            ) : null}
          </div>
        </header>

        <div className={css.layout}>
          <div className={css.content}>
            {recipe.images.length > 0 ? <RecipeImgSlider images={recipe.images} /> : null}
            {recipe.description ? <p className={css.description}>{recipe.description}</p> : null}
          </div>

          <aside className={css.rail}>
            <section className={css.utilityGroup}>
              <RecipeNutrition
                onPortionsChange={setPortions}
                portions={portions}
                recipe={recipe}
                scale={scale}
              />
            </section>
            <section
              className={css.utilityGroup}
              aria-label={t({ en: 'Ingredients', pl: 'Składniki' })}
            >
              <ul className={css.ingredientList}>
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient.id}>
                    {ingredient.imageUrl ? (
                      <img alt='' className={css.ingredientImage} src={ingredient.imageUrl} />
                    ) : (
                      <span aria-hidden='true' className={css.ingredientDot} />
                    )}
                    <span className={css.ingredientName}>{ingredient.name}</span>
                    {ingredient.productId ? (
                      <LinkIcon
                        aria-label={t({ en: 'Linked product', pl: 'Powiązany produkt' })}
                        className={css.linkedIcon}
                        role='img'
                      />
                    ) : null}
                    {ingredient.grams === null ? null : (
                      <span className={css.ingredientGrams}>
                        {formatWhole(ingredient.grams * scale)} g
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
            <RecipeRating rating={recipe.rating} recipeId={recipe.id} />
          </aside>
        </div>
      </article>
    </main>
  );
}
