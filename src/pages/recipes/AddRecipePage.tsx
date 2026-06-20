import clsx from 'clsx';
import { useNavigate } from '@tanstack/react-router';
import { SendHorizontalIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { Label } from '@/components/label/Label';
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
            <div className={css.fieldList}>
              <Label text='Name'>
                <TextInput
                  name='name'
                  onValueChange={(value) => setDraft((current) => ({ ...current, name: value }))}
                  placeholder='Smoky chicken burrito bowl'
                  required
                  value={draft.name}
                />
              </Label>

              <Label text='Description'>
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
              </Label>

              <Label text='Ingredients'>
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
              </Label>

              <Label text='Tags'>
                <TextInput
                  name='tags'
                  onValueChange={(value) => setDraft((current) => ({ ...current, tags: value }))}
                  placeholder='dinner, chicken, high protein'
                  value={draft.tags}
                />
              </Label>

              <Label text='Rating'>
                <NumberInput
                  max={5}
                  min={1}
                  name='rating'
                  onValueChange={(value) => setDraft((current) => ({ ...current, rating: value }))}
                  placeholder='1-5'
                  value={draft.rating}
                />
              </Label>

              <Label text='Kcal'>
                <NumberInput
                  min={0}
                  name='kcal'
                  onValueChange={(value) => setDraft((current) => ({ ...current, kcal: value }))}
                  value={draft.kcal}
                />
              </Label>

              <Label text='Protein'>
                <NumberInput
                  min={0}
                  name='protein'
                  onValueChange={(value) => setDraft((current) => ({ ...current, protein: value }))}
                  value={draft.protein}
                />
              </Label>

              <Label text='Carbs'>
                <NumberInput
                  min={0}
                  name='carbs'
                  onValueChange={(value) => setDraft((current) => ({ ...current, carbs: value }))}
                  value={draft.carbs}
                />
              </Label>

              <Label text='Fats'>
                <NumberInput
                  min={0}
                  name='fats'
                  onValueChange={(value) => setDraft((current) => ({ ...current, fats: value }))}
                  value={draft.fats}
                />
              </Label>

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
                variant='main'
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
