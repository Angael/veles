import { KcalMacrosForm } from '@/components/kcal-macros-form/KcalMacrosForm';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextareaInput } from '@/components/textarea-input/TextareaInput';
import { TextInput } from '@/components/text-input/TextInput';
import type { UpdateRecipeInput } from './recipes.api';
import css from './RecipeForm.module.css';

export type RecipeFormDraft = Omit<UpdateRecipeInput, 'id'>;

type RecipeFormProps = {
  draft: RecipeFormDraft;
  onDraftChange: (draft: RecipeFormDraft) => void;
};

export function RecipeForm({ draft, onDraftChange }: RecipeFormProps) {
  return (
    <div className={css.fieldList}>
      <Label text='Name'>
        <TextInput
          name='name'
          onValueChange={(value) => onDraftChange({ ...draft, name: value })}
          placeholder='Smoky chicken burrito bowl'
          required
          value={draft.name}
        />
      </Label>

      <Label text='Description'>
        <TextareaInput
          name='description'
          onChange={(event) => onDraftChange({ ...draft, description: event.currentTarget.value })}
          placeholder='Short recipe description'
          rows={4}
          value={draft.description}
        />
      </Label>

      <Label text='Ingredients'>
        <TextareaInput
          name='ingredients'
          onChange={(event) =>
            onDraftChange({
              ...draft,
              ingredients: event.currentTarget.value.split('\n'),
            })
          }
          placeholder='One ingredient per line'
          rows={6}
          value={draft.ingredients.join('\n')}
        />
      </Label>

      <Label text='Tags'>
        <TextInput
          name='tags'
          onValueChange={(value) => onDraftChange({ ...draft, tags: value.split(',') })}
          placeholder='dinner, chicken, high protein'
          value={draft.tags.join(', ')}
        />
      </Label>

      <div className={css.fieldGrid}>
        <Label text='Rating'>
          <NumberInput
            max={5}
            min={1}
            name='rating'
            onValueChange={(value) => onDraftChange({ ...draft, rating: value })}
            placeholder='1-5'
            step={1}
            value={draft.rating}
          />
        </Label>

        <Label text='Portions'>
          <NumberInput
            min={1}
            name='portions'
            onValueChange={(value) => onDraftChange({ ...draft, portions: value ?? 1 })}
            required
            step={1}
            value={draft.portions}
          />
        </Label>
      </div>

      <KcalMacrosForm
        fatName='fats'
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
