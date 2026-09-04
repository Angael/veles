import type { UseNavigateResult } from '@tanstack/react-router';
import { useRecordCustomCaloriesMutation } from '../calories.query';
import { Btn } from '@/components/btn/Btn';
import { KcalMacrosForm } from '@/components/kcal-macros-form/KcalMacrosForm';
import { Label } from '@/components/label/Label';
import { TextInput } from '@/components/text-input/TextInput';
import { TypedForm } from '@/components/typed-form/TypedForm';
import { TypedFormData } from '@/lib/typedFormData';
import css from '../CalorieFlows.module.css';

export function QuickAddPage({ date }: { date: string }) {
  const recordMutation = useRecordCustomCaloriesMutation();

  async function submit(formData: TypedFormData, navigate: UseNavigateResult<string>) {
    await recordMutation.mutateAsync({
      date,
      name: formData.string('name') || 'Quick add',
      kcal: formData.number('kcal'),
      protein: formData.optionalNumber('protein'),
      fat: formData.optionalNumber('fat'),
      carbs: formData.optionalNumber('carbs'),
    });
    await navigate({ to: '/calories', search: { date } });
  }

  return (
    <main className={css.page}>
      <header className={css.header}>
        <div>
          <h1>Quick add</h1>
          <p>Record energy now. Macros are optional.</p>
        </div>
      </header>
      <section className={css.panel}>
        <TypedForm className={css.form} onSubmit={submit}>
          <Label text='Label'>
            <TextInput defaultValue='Quick add' name='name' required />
          </Label>

          <KcalMacrosForm />

          <Btn loading={recordMutation.isPending} type='submit'>
            Add to diary
          </Btn>
        </TypedForm>
      </section>
    </main>
  );
}
