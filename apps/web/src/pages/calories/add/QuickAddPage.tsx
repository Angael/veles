import { useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { useRecordCustomCaloriesMutation } from '../calories.query';
import { Btn } from '@/components/btn/Btn';
import { KcalMacrosForm } from '@/components/kcal-macros-form/KcalMacrosForm';
import { Label } from '@/components/label/Label';
import { TextInput } from '@/components/text-input/TextInput';
import { TypedFormData } from '@/lib/formData';
import css from '../CalorieFlows.module.css';

export function QuickAddPage({ date }: { date: string }) {
  const navigate = useNavigate();
  const recordMutation = useRecordCustomCaloriesMutation();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new TypedFormData(event.currentTarget);

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
        <form className={css.form} onSubmit={(event) => void submit(event)}>
          <Label text='Label'>
            <TextInput defaultValue='Quick add' name='name' required />
          </Label>

          <KcalMacrosForm />

          <Btn loading={recordMutation.isPending} type='submit'>
            Add to diary
          </Btn>
        </form>
      </section>
    </main>
  );
}
