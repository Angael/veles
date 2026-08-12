import { Link } from '@tanstack/react-router';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { RecipeImgSlider } from './RecipeImgSlider';
import { RecipeNutrition } from './RecipeNutrition';
import { RecipeRating } from './RecipeRating';
import type { RecipeViewItem } from './recipes.api';
import css from './RecipeViewPage.module.css';

type RecipeViewPageProps = {
  recipe: RecipeViewItem;
};

export function RecipeViewPage({ recipe }: RecipeViewPageProps) {
  return (
    <main className={css.page}>
      <article className={css.recipe}>
        <header className={css.heading}>
          <div className={css.identity}>
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

          {recipe.canManage ? (
            <div className={css.actions} aria-label='Recipe management actions' role='group'>
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
        </header>

        <div className={css.layout}>
          <div className={css.content}>
            {recipe.images.length > 0 ? <RecipeImgSlider images={recipe.images} /> : null}
            {recipe.description ? <p className={css.description}>{recipe.description}</p> : null}
          </div>

          <aside className={css.rail}>
            <section className={css.utilityGroup}>
              <RecipeNutrition recipe={recipe} />
            </section>
            <section className={css.utilityGroup} aria-label='Ingredients'>
              <ul className={css.ingredientList}>
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={`${index}-${ingredient}`}>{ingredient}</li>
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
