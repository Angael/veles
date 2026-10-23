import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { TextareaInput } from '@/components/ui/textarea-input/TextareaInput';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { IngredientsField } from './IngredientsField';
import type { RecipeFormDraft } from './recipeDraft';
import css from './RecipeForm.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type RecipeFormProps = {
  draft: RecipeFormDraft;
  onDraftChange: (draft: RecipeFormDraft) => void;
};

export function RecipeForm({ draft, onDraftChange }: RecipeFormProps) {
  const { t } = useI18n();

  return (
    <div className={css.fieldList}>
      <Label text={t({ en: 'Name', pl: 'Nazwa' })}>
        <TextInput
          name='name'
          onValueChange={(value) => onDraftChange({ ...draft, name: value })}
          placeholder={t({
            en: 'Smoky chicken burrito bowl',
            pl: 'Miska burrito z wędzonym kurczakiem',
          })}
          required
          value={draft.name}
        />
      </Label>

      <Label text={t({ en: 'Description', pl: 'Opis' })}>
        <TextareaInput
          name='description'
          onChange={(event) => onDraftChange({ ...draft, description: event.currentTarget.value })}
          placeholder={t({ en: 'Short recipe description', pl: 'Krótki opis przepisu' })}
          rows={4}
          value={draft.description}
        />
      </Label>

      <IngredientsField
        ingredients={draft.ingredients}
        onChange={(ingredients) => onDraftChange({ ...draft, ingredients })}
      />

      <Label text={t({ en: 'Tags', pl: 'Tagi' })}>
        <TextInput
          name='tags'
          onValueChange={(value) => onDraftChange({ ...draft, tags: value.split(',') })}
          placeholder={t({
            en: 'dinner, chicken, high protein',
            pl: 'obiad, kurczak, dużo białka',
          })}
          value={draft.tags.join(', ')}
        />
      </Label>

      <div className={css.fieldGrid}>
        <Label text={t({ en: 'Rating', pl: 'Ocena' })}>
          <NumberInput
            max={5}
            min={1}
            name='rating'
            onValueChange={(value) => onDraftChange({ ...draft, rating: value })}
            placeholder='1-5'
            value={draft.rating}
          />
        </Label>

        <Label text={t({ en: 'Portions it makes', pl: 'Liczba porcji' })}>
          <NumberInput
            min={1}
            name='portions'
            onValueChange={(value) => onDraftChange({ ...draft, portions: value ?? 1 })}
            required
            value={draft.portions}
          />
        </Label>
      </div>
    </div>
  );
}
