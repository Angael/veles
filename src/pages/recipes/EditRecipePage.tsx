import { useNavigate, useRouter } from '@tanstack/react-router';
import { SaveIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { RecipeForm, type RecipeFormDraft } from './RecipeForm';
import { updateRecipe, type RecipeLibraryItem } from './recipes.api';
import css from './EditRecipePage.module.css';

type EditRecipePageProps = {
  recipe: RecipeLibraryItem;
};

export function EditRecipePage({ recipe }: EditRecipePageProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [draft, setDraft] = useState<RecipeFormDraft>(() => ({
    carbs: recipe.carbs,
    description: recipe.description,
    fats: recipe.fats,
    ingredients: recipe.ingredients.join('\n'),
    kcal: recipe.kcal,
    name: recipe.name,
    portions: recipe.portions,
    protein: recipe.protein,
    rating: recipe.rating,
    tags: recipe.tags.join(', '),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className={css.page}>
      <Card as='section' className={css.card}>
        <h1>Edit {recipe.name}</h1>

        <form
          className={css.form}
          onSubmit={async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setBusy(true);
            setError(null);

            try {
              await updateRecipe({
                data: {
                  ...draft,
                  id: recipe.id,
                  ingredients: splitLines(draft.ingredients),
                  tags: splitTags(draft.tags),
                },
              });
              await router.invalidate();
              await navigate({ params: { id: recipe.id }, to: '/recipes/view/$id' });
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : 'Recipe update failed');
            } finally {
              setBusy(false);
            }
          }}
        >
          <RecipeForm draft={draft} onDraftChange={setDraft} />

          <p className={css.photoNote}>
            Photos stay as they are for now and are not editable here.
          </p>

          {error ? <div className={css.errorBox}>{error}</div> : null}

          <div className={css.actions}>
            <Btn
              disabled={busy}
              icon={<SaveIcon aria-hidden='true' size={18} />}
              type='submit'
              variant='main'
            >
              {busy ? 'Saving...' : 'Save changes'}
            </Btn>
          </div>
        </form>
      </Card>
    </main>
  );
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitTags(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
