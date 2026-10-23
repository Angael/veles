import { useThrottledValue } from '@tanstack/react-pacer';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card/Card';
import { FloatingButton } from '@/components/ui/floating-button/FloatingButton';
import { SelectInput } from '@/components/ui/select-input/SelectInput';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { filterAndRankBySearch, type RankedSearchFields } from '@/lib/search/filterAndRankBySearch';
import type { RecipeLibraryItem } from '../recipes.api';
import css from './RecipesPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type RecipesPageProps = {
  recipes: RecipeLibraryItem[];
};

const recipeScopeItems = [
  { label: { en: 'All recipes', pl: 'Wszystkie przepisy' }, value: 'all' },
  { label: { en: 'Your recipes', pl: 'Twoje przepisy' }, value: 'owned' },
] as const;

const recipeSearchFields = [
  (recipe) => recipe.name,
  (recipe) => recipe.description,
] satisfies RankedSearchFields<RecipeLibraryItem>;

export function RecipesPage({ recipes }: RecipesPageProps) {
  const { formatNumber, formatWhole, t } = useI18n();
  const [recipeScope, setRecipeScope] = useState<'all' | 'owned'>('all');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [search] = useThrottledValue(searchInputValue, { wait: 200 });
  const scopedRecipes =
    recipeScope === 'owned' ? recipes.filter((recipe) => recipe.isOwned) : recipes;
  const visibleRecipes = filterAndRankBySearch(scopedRecipes, search, recipeSearchFields);

  return (
    <main className={css.page}>
      <title>{t({ en: 'Recipes', pl: 'Przepisy' })}</title>
      <section className={css.controls} data-appear>
        <div className={css.toolbar}>
          <label className={css.searchField}>
            <TextInput
              aria-label={t({ en: 'Search recipes', pl: 'Szukaj przepisów' })}
              autoComplete='off'
              className={css.searchInput}
              name='search'
              onValueChange={setSearchInputValue}
              placeholder={t({
                en: 'Search by name or description',
                pl: 'Szukaj po nazwie lub opisie',
              })}
              type='search'
              value={searchInputValue}
            />
          </label>
          <SelectInput
            aria-label={t({ en: 'Recipe ownership', pl: 'Właściciel przepisu' })}
            items={recipeScopeItems.map((item) => ({ ...item, label: t(item.label) }))}
            onValueChange={(value) => {
              if (value) {
                setRecipeScope(value);
              }
            }}
            value={recipeScope}
          />
        </div>
      </section>

      <section className={css.grid} data-appear='1'>
        {visibleRecipes.map((recipe) => (
          <Link
            className={css.cardLink}
            key={recipe.id}
            params={{ id: recipe.id }}
            to='/recipes/view/$id'
          >
            <Card
              as='article'
              className={clsx(css.card, recipe.images.length > 0 && css.cardWithImage)}
            >
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
                  </div>
                </div>

                {recipe.description ? (
                  <p className={css.description}>{recipe.description.slice(0, 280)}</p>
                ) : null}

                <div className={css.recipeFooter}>
                  {recipe.rating !== null ? (
                    <span className={css.footerItem}>{formatNumber(recipe.rating)}/5</span>
                  ) : null}
                  {recipe.nutrition ? (
                    <p className={css.footerItem}>{formatWhole(recipe.nutrition.kcal)} KCAL</p>
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
        {t({ en: 'Add recipe', pl: 'Dodaj przepis' })}
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
