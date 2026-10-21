import { KcalMacrosForm } from '@/components/ui/kcal-macros-form/KcalMacrosForm';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { TextareaInput } from '@/components/ui/textarea-input/TextareaInput';
import { TextInput } from '@/components/ui/text-input/TextInput';
import css from './RecipeForm.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export type RecipeFormDraft = {
  carbs: number | null;
  description: string;
  fats: number | null;
  ingredients: string[];
  kcal: number | null;
  name: string;
  portions: number;
  protein: number | null;
  rating: number | null;
  tags: string[];
};

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

      <Label text={t({ en: 'Ingredients', pl: 'Składniki' })}>
        <TextareaInput
          name='ingredients'
          onChange={(event) =>
            onDraftChange({
              ...draft,
              ingredients: event.currentTarget.value.split('\n'),
            })
          }
          placeholder={t({ en: 'One ingredient per line', pl: 'Jeden składnik w linii' })}
          rows={6}
          value={draft.ingredients.join('\n')}
        />
      </Label>

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

        <Label text={t({ en: 'Portions', pl: 'Porcje' })}>
          <NumberInput
            min={1}
            name='portions'
            onValueChange={(value) => onDraftChange({ ...draft, portions: value ?? 1 })}
            required
            value={draft.portions}
          />
        </Label>
      </div>

      <KcalMacrosForm
        fatName='fats'
        kcalRequired={false}
        onValueChange={(field, value) =>
          onDraftChange({
            ...draft,
            [field === 'fat' ? 'fats' : field]: value,
          })
        }
        values={{
          kcal: draft.kcal,
          protein: draft.protein,
          fat: draft.fats,
          carbs: draft.carbs,
        }}
      />
    </div>
  );
}
