import { useMutation } from '@tanstack/react-query';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { SaveIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { ErrorCard } from '@/components/error-card/ErrorCard';
import { RecipeForm, type RecipeFormDraft } from './RecipeForm';
import { updateRecipe, type RecipeLibraryItem } from './recipes.api';
import css from './EditRecipePage.module.css';

type EditRecipePageProps = {
  recipe: RecipeLibraryItem;
};

export function EditRecipePage({ recipe }: EditRecipePageProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [draft, setDraft] = useState<RecipeFormDraft>(() => recipeToDraft(recipe));
  const saveMutation = useMutation({
    mutationFn: updateRecipe,
    onSuccess: async () => {
      await navigate({ params: { id: recipe.id }, to: '/recipes/view/$id' });
      await router.invalidate();
    },
  });

  return (
    <main className={css.page}>
      <Card as='section' className={css.card}>
        <h1>Edit {recipe.name}</h1>

        <form
          className={css.form}
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            saveMutation.mutate({
              data: {
                ...draft,
                id: recipe.id,
                ingredients: splitLines(draft.ingredients),
                tags: splitTags(draft.tags),
              },
            });
          }}
        >
          <RecipeForm draft={draft} onDraftChange={setDraft} />

          <p className={css.photoNote}>
            Photos stay as they are for now and are not editable here.
          </p>

          {saveMutation.error ? (
            <ErrorCard
              message={
                saveMutation.error instanceof Error
                  ? saveMutation.error.message
                  : 'Recipe update failed'
              }
              title='Recipe not saved'
            />
          ) : null}

          <div className={css.actions}>
            <Btn
              icon={<SaveIcon aria-hidden='true' size={18} />}
              loading={saveMutation.isPending}
              type='submit'
              variant='main'
            >
              Save changes
            </Btn>
          </div>
        </form>
      </Card>
    </main>
  );
}

function recipeToDraft(recipe: RecipeLibraryItem): RecipeFormDraft {
  return {
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
  };
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
