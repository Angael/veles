import { Link } from '@tanstack/react-router';
import { LinkIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { ingredientLine } from './ingredientLine';
import { RecipeImgSlider } from './RecipeImgSlider';
import { RecipeNutrition } from './RecipeNutrition';
import { RecipeRating } from './RecipeRating';
import type { RecipeViewItem } from '../recipes.api';
import css from './RecipeViewPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type RecipeViewPageProps = {
  recipe: RecipeViewItem;
};

export function RecipeViewPage({ recipe }: RecipeViewPageProps) {
  const { formatNumber, t } = useI18n();
  const [portions, setPortions] = useState(Math.max(1, recipe.portions));
  const scale = portions / Math.max(1, recipe.portions);

  return (
    <main className={css.page}>
      <article className={css.recipe}>
        <header className={css.heading}>
          <div className={css.identity}>
            <h1>{recipe.name}</h1>
            {recipe.tags.length > 0 ? (
              <div className={css.tags} aria-label={t({ en: 'Recipe tags', pl: 'Tagi przepisu' })}>
                {recipe.tags.map((tag) => (
                  <span className={css.tag} key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {recipe.canManage ? (
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
            </div>
          ) : null}
        </header>

        <div className={css.layout}>
          <div className={css.content}>
            {recipe.images.length > 0 ? <RecipeImgSlider images={recipe.images} /> : null}
            {recipe.description ? <p className={css.description}>{recipe.description}</p> : null}
          </div>

          <aside className={css.rail}>
            <section className={css.utilityGroup}>
              <RecipeNutrition onPortionsChange={setPortions} portions={portions} recipe={recipe} />
            </section>
            <section
              className={css.utilityGroup}
              aria-label={t({ en: 'Ingredients', pl: 'Składniki' })}
            >
              <ul className={css.ingredientList}>
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient.id}>
                    {ingredientLine(ingredient, scale, formatNumber)}
                    {ingredient.productId ? (
                      <LinkIcon
                        aria-label={t({ en: 'Linked product', pl: 'Powiązany produkt' })}
                        className={css.linkedIcon}
                        role='img'
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
            {recipe.canManage ? <RecipeRating rating={recipe.rating} recipeId={recipe.id} /> : null}
          </aside>
        </div>
      </article>
    </main>
  );
}
