import { useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRecordCustomCaloriesMutation } from '../calories.query';
import { Btn } from '@/components/btn/Btn';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextInput } from '@/components/text-input/TextInput';
import css from '../CalorieFlows.module.css';

export function QuickAddPage({ date }: { date: string }) {
  const navigate = useNavigate();
  const recordMutation = useRecordCustomCaloriesMutation();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const optional = (key: string) => {
      const value = String(data.get(key) ?? '').trim();
      return value ? Number(value) : undefined;
    };

    await recordMutation.mutateAsync({
      date,
      name: String(data.get('name') || 'Quick add'),
      kcal: Number(data.get('kcal')),
      protein: optional('protein'),
      fat: optional('fat'),
      carbs: optional('carbs'),
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

          <div className={css.nutritionMacros}>
            <Label text='kcal'>
              <NumberInput min={0} name='kcal' required />
            </Label>

            <Label text='Protein (g)'>
              <NumberInput min={0} name='protein' />
            </Label>

            <Label text='Fat (g)'>
              <NumberInput min={0} name='fat' />
            </Label>

            <Label text='Carbs (g)'>
              <NumberInput min={0} name='carbs' />
            </Label>
          </div>

          <Btn loading={recordMutation.isPending} type='submit'>
            Add to diary
          </Btn>
        </form>
      </section>
    </main>
  );
}
