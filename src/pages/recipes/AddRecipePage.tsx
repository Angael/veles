import clsx from 'clsx';
import { useNavigate } from '@tanstack/react-router';
import { SendHorizontalIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { ErrorCard } from '@/components/error-card/ErrorCard';
import { UploadTileGrid } from '@/components/upload-tile-grid/UploadTileGrid';
import { RecipeForm, type RecipeFormDraft } from './RecipeForm';
import css from './AddRecipePage.module.css';
import {
  RECIPE_UPLOAD_MAX_PHOTO_BYTES,
  RECIPE_UPLOAD_MAX_PHOTO_COUNT,
} from '@/routes/api/recipes/upload';

type AddRecipeDraft = RecipeFormDraft & {
  selectedFiles: File[];
};

const EMPTY_DRAFT: AddRecipeDraft = {
  carbs: null,
  description: '',
  fats: null,
  ingredients: '',
  kcal: null,
  name: '',
  portions: 1,
  protein: null,
  rating: null,
  selectedFiles: [],
  tags: '',
};

export function AddRecipePage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<AddRecipeDraft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className={css.page}>
      <section className={css.content}>
        <Card as='section' className={css.formCard}>
          <h1>Add recipe</h1>

          <form
            className={css.form}
            onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              setBusy(true);
              setError(null);

              try {
                const formData = new FormData(event.currentTarget);

                for (const file of draft.selectedFiles) {
                  formData.append('photos', file);
                }

                const response = await fetch('/api/recipes/upload', {
                  body: formData,
                  method: 'POST',
                });

                if (!response.ok) {
                  const result = (await response.json().catch(() => null)) as {
                    error?: string;
                  } | null;

                  throw new Error(result?.error ?? 'Recipe upload failed');
                }

                const result = (await response.json()) as { id?: string };

                if (!result.id) {
                  throw new Error('Recipe upload failed');
                }

                navigate({ params: { id: result.id }, to: '/recipes/view/$id' });
              } catch (submitError) {
                setError(
                  submitError instanceof Error ? submitError.message : 'Recipe upload failed',
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className={css.formBody}>
              <RecipeForm
                draft={draft}
                onDraftChange={(nextDraft) => setDraft((current) => ({ ...current, ...nextDraft }))}
              />

              <div className={clsx(css.field, css.uploadFieldWrap)}>
                <span>Photos</span>
                <UploadTileGrid
                  files={draft.selectedFiles}
                  maxItemSize={RECIPE_UPLOAD_MAX_PHOTO_BYTES}
                  maxItems={RECIPE_UPLOAD_MAX_PHOTO_COUNT}
                  onFilesChange={(selectedFiles) =>
                    setDraft((current) => ({ ...current, selectedFiles }))
                  }
                />
              </div>
            </div>

            {error ? <ErrorCard message={error} title='Recipe not saved' /> : null}

            <div className={css.actions}>
              <Btn
                icon={<SendHorizontalIcon aria-hidden='true' size={18} />}
                loading={busy}
                type='submit'
                variant='main'
              >
                Save recipe
              </Btn>
            </div>
          </form>
        </Card>
      </section>
    </main>
  );
}
