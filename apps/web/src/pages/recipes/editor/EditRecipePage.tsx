import { useRouter, type UseNavigateResult } from '@tanstack/react-router';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { FormSubmitRow } from '@/components/ui/form-submit-row/FormSubmitRow';
import { PhotosField } from '@/components/ui/upload-tile-grid/PhotosField';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import type { TypedFormData } from '@/components/ui/typed-form/TypedFormData';
import {
  appendOrderedPhotos,
  type OrderedPhoto,
  toStoredPhotos,
} from '@/lib/storage/orderedPhotos';
import { RecipeForm, type RecipeFormDraft } from './RecipeForm';
import type { RecipeLibraryItem } from '../recipes.api';
import { useUpdateRecipeMutation } from '../recipes.query';
import { RECIPE_UPLOAD_MAX_PHOTO_BYTES, RECIPE_UPLOAD_MAX_PHOTO_COUNT } from '../recipeUpload.api';
import css from './EditRecipePage.module.css';
import { useUnsavedChangesGuard } from '@/lib/useUnsavedChangesGuard';

type EditRecipePageProps = {
  recipe: RecipeLibraryItem;
};

export function EditRecipePage({ recipe }: EditRecipePageProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<RecipeFormDraft>(() => recipeToDraft(recipe));
  const [photos, setPhotos] = useState<OrderedPhoto[]>(() => toStoredPhotos(recipe.images));
  const saveMutation = useUpdateRecipeMutation();
  const { markDirty, markSaved } = useUnsavedChangesGuard();

  /** Sends recipe fields with the full ordered photo list; failures keep picked files for a retry. */
  async function handleSubmit(data: TypedFormData, navigate: UseNavigateResult<string>) {
    const formData = data.raw();
    formData.append('id', recipe.id);
    appendOrderedPhotos(formData, photos);

    try {
      await saveMutation.mutateAsync({ data: formData });
    } catch {
      return;
    }

    markSaved();
    await navigate({ params: { id: recipe.id }, replace: true, to: '/recipes/view/$id' })
      .then(() => router.invalidate())
      .catch(() => undefined);
  }

  return (
    <main>
      <Card as='section'>
        <TypedForm
          className={css.form}
          errorMsg={saveMutation.error?.message}
          onSubmit={handleSubmit}
        >
          <RecipeForm
            draft={draft}
            onDraftChange={(nextDraft) => {
              markDirty();
              setDraft(nextDraft);
            }}
          />

          <PhotosField
            maxItemSize={RECIPE_UPLOAD_MAX_PHOTO_BYTES}
            maxItems={RECIPE_UPLOAD_MAX_PHOTO_COUNT}
            onPhotosChange={(nextPhotos) => {
              markDirty();
              setPhotos(nextPhotos);
            }}
            photos={photos}
          />

          <FormSubmitRow>
            <Btn loading={saveMutation.isPending} type='submit'>
              Save
            </Btn>
          </FormSubmitRow>
        </TypedForm>
      </Card>
    </main>
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
