import { useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { FormCard, FormFooter, FormPage } from '@/components/ui/form-layout/FormLayout';
import { RecipeForm, type RecipeFormDraft } from './RecipeForm';
import type { RecipeLibraryItem } from '../recipes.api';
import { useUpdateRecipeMutation } from '../recipes.query';
import css from './EditRecipePage.module.css';
import { useUnsavedChangesGuard } from '@/lib/useUnsavedChangesGuard';

type EditRecipePageProps = {
  recipe: RecipeLibraryItem;
};

export function EditRecipePage({ recipe }: EditRecipePageProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [draft, setDraft] = useState<RecipeFormDraft>(() => recipeToDraft(recipe));
  const saveMutation = useUpdateRecipeMutation();
  const { markDirty, markSaved } = useUnsavedChangesGuard();

  return (
    <FormPage>
      <FormCard
        errorMsg={saveMutation.error?.message}
        onSubmit={() => {
          saveMutation.mutate(
            { data: { ...draft, id: recipe.id } },
            {
              onSuccess: () => {
                markSaved();
                void navigate({
                  params: { id: recipe.id },
                  replace: true,
                  to: '/recipes/view/$id',
                })
                  .then(() => router.invalidate())
                  .catch(() => undefined);
              },
            },
          );
        }}
      >
        <RecipeForm
          draft={draft}
          onDraftChange={(nextDraft) => {
            markDirty();
            setDraft(nextDraft);
          }}
        />

        <p className={css.photoNote}>Photos stay as they are for now and are not editable here.</p>

        <FormFooter loading={saveMutation.isPending} submitLabel='Save' />
      </FormCard>
    </FormPage>
  );
}

function recipeToDraft(recipe: RecipeLibraryItem): RecipeFormDraft {
  return {
    carbs: recipe.carbs,
    description: recipe.description,
    fats: recipe.fats,
    ingredients: recipe.ingredients,
    kcal: recipe.kcal,
    name: recipe.name,
    portions: recipe.portions,
    protein: recipe.protein,
    rating: recipe.rating,
    tags: recipe.tags,
  };
}
