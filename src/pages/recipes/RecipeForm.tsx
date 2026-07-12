import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextareaInput } from '@/components/textarea-input/TextareaInput';
import { TextInput } from '@/components/text-input/TextInput';
import css from './RecipeForm.module.css';

export type RecipeFormDraft = {
  carbs: number | null;
  description: string;
  fats: number | null;
  ingredients: string;
  kcal: number | null;
  name: string;
  portions: number;
  protein: number | null;
  rating: number | null;
  tags: string;
};

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
          onChange={(event) => onDraftChange({ ...draft, ingredients: event.currentTarget.value })}
          placeholder='One ingredient per line'
          rows={6}
          value={draft.ingredients}
        />
      </Label>

      <Label text='Tags'>
        <TextInput
          name='tags'
          onValueChange={(value) => onDraftChange({ ...draft, tags: value })}
          placeholder='dinner, chicken, high protein'
          value={draft.tags}
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

        <Label text='Kcal'>
          <NumberInput
            min={0}
            name='kcal'
            onValueChange={(value) => onDraftChange({ ...draft, kcal: value })}
            step={1}
            value={draft.kcal}
          />
        </Label>

        <Label text='Protein'>
          <NumberInput
            min={0}
            name='protein'
            onValueChange={(value) => onDraftChange({ ...draft, protein: value })}
            step={1}
            value={draft.protein}
          />
        </Label>

        <Label text='Carbs'>
          <NumberInput
            min={0}
            name='carbs'
            onValueChange={(value) => onDraftChange({ ...draft, carbs: value })}
            step={1}
            value={draft.carbs}
          />
        </Label>

        <Label text='Fats'>
          <NumberInput
            min={0}
            name='fats'
            onValueChange={(value) => onDraftChange({ ...draft, fats: value })}
            step={1}
            value={draft.fats}
          />
        </Label>
      </div>
    </div>
  );
}
