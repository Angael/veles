import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { format } from 'date-fns';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { DateInput } from '@/components/ui/date-input/DateInput';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import css from './WeightEntryPages.module.css';
import { useSaveWeightMutation } from './weight.query';

export function AddWeightPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const mutation = useSaveWeightMutation();

  return (
    <main className={css.page}>
      <Card as='section' className={css.formCard}>
        <div className={css.intro}>
          <h1>Add weight for a date</h1>
          <p>Use this when filling a gap or entering a measurement from another day.</p>
        </div>
        <TypedForm
          className={css.form}
          onSubmit={() => {
            if (weightKg === null) {
              return;
            }

            mutation.mutate(
              { data: { date, weightKg } },
              {
                onSuccess: () => {
                  void router
                    .invalidate()
                    .then(() => navigate({ to: '/weight' }))
                    .catch(() => undefined);
                },
              },
            );
          }}
        >
          <Label text='Date'>
            <DateInput
              max={today}
              onChange={(event) => setDate(event.currentTarget.value)}
              required
              value={date}
            />
          </Label>
          <div className={css.weightEntry}>
            <Label text='Weight (kg)'>
              <NumberInput
                enterKeyHint='done'
                max={300}
                min={30}
                onValueChange={setWeightKg}
                placeholder='e.g. 78.4'
                required
                stepperStep={0.1}
                value={weightKg}
              />
            </Label>
            <Btn
              disabled={!date || weightKg === null}
              loading={mutation.isPending}
              size='sm'
              type='submit'
            >
              Save entry
            </Btn>
          </div>
          <div className={css.formActions}>
            <Btn isLink render={<Link to='/weight' />} size='sm' variant='ghost'>
              Cancel
            </Btn>
          </div>
        </TypedForm>
      </Card>
    </main>
  );
}
