import { useThrottledValue } from '@tanstack/react-pacer';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/card/Card';
import { FloatingButton } from '@/components/floating-button/FloatingButton';
import { TextInput } from '@/components/text-input/TextInput';
import { filterAndRankBySearch, type RankedSearchFields } from '@/lib/search/filterAndRankBySearch';
import type { RecipeLibraryItem } from './recipes.api';
import css from './RecipesPage.module.css';

type RecipesPageProps = {
  recipes: RecipeLibraryItem[];
};

const recipeSearchFields = [
  (recipe) => recipe.name,
  (recipe) => recipe.tags,
  (recipe) => recipe.description,
] satisfies RankedSearchFields<RecipeLibraryItem>;

export function RecipesPage({ recipes }: RecipesPageProps) {
  const [searchInputValue, setSearchInputValue] = useState('');
  const [search] = useThrottledValue(searchInputValue, { wait: 200 });
  const visibleRecipes = filterAndRankBySearch(recipes, search, recipeSearchFields);

  return (
    <main className={css.page}>
      <title>Recipes</title>
      <section className={css.controls}>
        <div className={css.toolbar}>
          <label className={css.searchField}>
            <TextInput
              aria-label='Search recipes'
              autoComplete='off'
              className={css.searchInput}
              name='search'
              onValueChange={setSearchInputValue}
              placeholder='Search by name, tags, or description'
              type='search'
              value={searchInputValue}
            />
          </label>
        </div>
      </section>

      <section className={css.grid}>
        {visibleRecipes.map((recipe) => (
          <Link
            className={css.cardLink}
            key={recipe.id}
            params={{ id: recipe.id }}
            to='/recipes/view/$id'
          >
            <Card as='article' className={css.card}>
              {recipe.images.length > 0 ? (
                <div className={clsx(css.imageLayout, getImageLayoutClass(recipe.images.length))}>
                  {recipe.images.slice(0, 3).map((image, index) => (
                    <img
                      alt=''
                      className={css.recipeImage}
                      key={`${recipe.id}-${index}`}
                      src={image.url}
                    />
                  ))}
                </div>
              ) : null}

              <div className={css.cardBody}>
                <div className={css.cardHeader}>
                  <div className={css.titleBlock}>
                    <h2>{recipe.name}</h2>

                    {recipe.tags.length > 0 ? (
                      <div className={css.tags}>
                        {recipe.tags.map((tag) => (
                          <span className={css.tag} key={tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {recipe.description ? (
                  <p className={css.description}>{recipe.description.slice(0, 280)}</p>
                ) : null}

                <div className={css.recipeFooter}>
                  {recipe.rating !== null ? (
                    <span className={css.footerItem}>{recipe.rating}/5</span>
                  ) : null}
                  {recipe.kcal !== null ? (
                    <p className={css.footerItem}>{String(recipe.kcal)} KCAL</p>
                  ) : null}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </section>

      <FloatingButton
        icon={<PlusIcon aria-hidden='true' size={18} strokeWidth={1.8} />}
        to='/recipes/add'
      >
        Add recipe
      </FloatingButton>
    </main>
  );
}

function getImageLayoutClass(imageCount: number) {
  if (imageCount >= 3) {
    return css.imageLayoutThree;
  }

  if (imageCount === 2) {
    return css.imageLayoutTwo;
  }

  return css.imageLayoutOne;
}
