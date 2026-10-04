import type { UseNavigateResult } from '@tanstack/react-router';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { FormSubmitRow } from '@/components/ui/form-submit-row/FormSubmitRow';
import { PhotosField } from '@/components/ui/upload-tile-grid/PhotosField';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { TypedFormData } from '@/components/ui/typed-form/TypedFormData';
import { appendOrderedPhotos, type OrderedPhoto } from '@/lib/storage/orderedPhotos';
import { RecipeForm, type RecipeFormDraft } from './RecipeForm';
import { RECIPE_UPLOAD_MAX_PHOTO_BYTES, RECIPE_UPLOAD_MAX_PHOTO_COUNT } from '../recipeUpload.api';
import css from './AddRecipePage.module.css';
import { useCreateRecipeMutation } from '../recipes.query';
import { useUnsavedChangesGuard } from '@/lib/useUnsavedChangesGuard';

type AddRecipeDraft = RecipeFormDraft & {
  photos: OrderedPhoto[];
};

const EMPTY_DRAFT: AddRecipeDraft = {
  carbs: null,
  description: '',
  fats: null,
  ingredients: [],
  kcal: null,
  name: '',
  portions: 1,
  protein: null,
  photos: [],
  rating: null,
  tags: [],
};

export function AddRecipePage() {
  const createMutation = useCreateRecipeMutation();
  const [draft, setDraft] = useState<AddRecipeDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const { markDirty, markSaved } = useUnsavedChangesGuard();

  /** Submits the recipe form and reports upload or navigation failures inline. */
  async function handleSubmit(data: TypedFormData, navigate: UseNavigateResult<string>) {
    setError(null);

    try {
      const formData = data.raw();
      appendOrderedPhotos(formData, draft.photos);

      const result = await createMutation.mutateAsync({ data: formData });

      markSaved();
      await navigate({ params: { id: result.id }, replace: true, to: '/recipes/view/$id' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Recipe upload failed');
    }
  }

  return (
    <main>
      <Card as='section'>
        <TypedForm className={css.form} errorMsg={error} onSubmit={handleSubmit}>
          <RecipeForm
            draft={draft}
            onDraftChange={(nextDraft) => {
              markDirty();
              setDraft((current) => ({ ...current, ...nextDraft }));
            }}
          />

          <PhotosField
            maxItemSize={RECIPE_UPLOAD_MAX_PHOTO_BYTES}
            maxItems={RECIPE_UPLOAD_MAX_PHOTO_COUNT}
            onPhotosChange={(photos) => {
              markDirty();
              setDraft((current) => ({ ...current, photos }));
            }}
            photos={draft.photos}
          />

          <FormSubmitRow>
            <Btn loading={createMutation.isPending} type='submit'>
              Add recipe
            </Btn>
          </FormSubmitRow>
        </TypedForm>
      </Card>
    </main>
  );
}
