import clsx from 'clsx';
import { SendHorizontalIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextareaInput } from '@/components/textarea-input/TextareaInput';
import { TextInput } from '@/components/text-input/TextInput';
import { UploadTileGrid } from '@/components/upload-tile-grid/UploadTileGrid';
import css from './AddRecipePage.module.css';
import {
  RECIPE_UPLOAD_MAX_PHOTO_BYTES,
  RECIPE_UPLOAD_MAX_PHOTO_COUNT,
} from '@/routes/api/recipes/upload';

type AddRecipeDraft = {
  carbs: number | null;
  description: string;
  fats: number | null;
  ingredients: string;
  kcal: number | null;
  name: string;
  protein: number | null;
  rating: number | null;
  selectedFiles: File[];
  tags: string;
};

const EMPTY_DRAFT: AddRecipeDraft = {
  carbs: null,
  description: '',
  fats: null,
  ingredients: '',
  kcal: null,
  name: '',
  protein: null,
  rating: null,
  selectedFiles: [],
  tags: '',
};

export function AddRecipePage() {
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
              } catch (submitError) {
                setError(
                  submitError instanceof Error ? submitError.message : 'Recipe upload failed',
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className={css.fieldList}>
              <label className={css.field}>
                <span>Name</span>
                <TextInput
                  name='name'
                  onValueChange={(value) => setDraft((current) => ({ ...current, name: value }))}
                  placeholder='Smoky chicken burrito bowl'
                  required
                  value={draft.name}
                />
              </label>

              <label className={css.field}>
                <span>Description</span>
                <TextareaInput
                  name='description'
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setDraft((current) => ({ ...current, description: value }));
                  }}
                  placeholder='Short recipe description'
                  rows={4}
                  value={draft.description}
                />
              </label>

              <label className={css.field}>
                <span>Ingredients</span>
                <TextareaInput
                  name='ingredients'
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setDraft((current) => ({ ...current, ingredients: value }));
                  }}
                  placeholder='One ingredient per line'
                  rows={6}
                  value={draft.ingredients}
                />
              </label>

              <label className={css.field}>
                <span>Tags</span>
                <TextInput
                  name='tags'
                  onValueChange={(value) => setDraft((current) => ({ ...current, tags: value }))}
                  placeholder='dinner, chicken, high protein'
                  value={draft.tags}
                />
              </label>

              <label className={css.field}>
                <span>Rating</span>
                <NumberInput
                  max={5}
                  min={1}
                  name='rating'
                  onValueChange={(value) => setDraft((current) => ({ ...current, rating: value }))}
                  placeholder='1-5'
                  value={draft.rating}
                />
              </label>

              <label className={css.field}>
                <span>Kcal</span>
                <NumberInput
                  min={0}
                  name='kcal'
                  onValueChange={(value) => setDraft((current) => ({ ...current, kcal: value }))}
                  value={draft.kcal}
                />
              </label>

              <label className={css.field}>
                <span>Protein</span>
                <NumberInput
                  min={0}
                  name='protein'
                  onValueChange={(value) => setDraft((current) => ({ ...current, protein: value }))}
                  value={draft.protein}
                />
              </label>

              <label className={css.field}>
                <span>Carbs</span>
                <NumberInput
                  min={0}
                  name='carbs'
                  onValueChange={(value) => setDraft((current) => ({ ...current, carbs: value }))}
                  value={draft.carbs}
                />
              </label>

              <label className={css.field}>
                <span>Fats</span>
                <NumberInput
                  min={0}
                  name='fats'
                  onValueChange={(value) => setDraft((current) => ({ ...current, fats: value }))}
                  value={draft.fats}
                />
              </label>

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

            {error ? <div className={css.errorBox}>{error}</div> : null}

            <div className={css.actions}>
              <Btn
                disabled={busy}
                icon={<SendHorizontalIcon aria-hidden='true' size={18} />}
                type='submit'
                variant='primary'
              >
                {busy ? 'Saving...' : 'Save recipe'}
              </Btn>
            </div>
          </form>
        </Card>
      </section>
    </main>
  );
}
