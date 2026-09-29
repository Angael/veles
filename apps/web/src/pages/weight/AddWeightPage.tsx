import { useNavigate, useRouter } from '@tanstack/react-router';
import { format } from 'date-fns';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { DateInput } from '@/components/ui/date-input/DateInput';
import { FormSubmitRow } from '@/components/ui/form-submit-row/FormSubmitRow';
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
    <main>
      <Card as='section'>
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
                    .then(() => navigate({ replace: true, to: '/weight' }))
                    .catch(() => undefined);
                },
              },
            );
          }}
        >
          <Label text='Weight (kg)'>
            <NumberInput
              enterKeyHint='done'
              max={300}
              min={30}
              onValueChange={setWeightKg}
              placeholder='e.g. 78.4'
              required
              size='lg'
              stepperStep={0.1}
              value={weightKg}
            />
          </Label>
          <FormSubmitRow>
            <Label text='Date'>
              <DateInput max={today} name='date' onValueChange={setDate} required value={date} />
            </Label>
            <Btn disabled={!date || weightKg === null} loading={mutation.isPending} type='submit'>
              Add weight
            </Btn>
          </FormSubmitRow>
        </TypedForm>
      </Card>
    </main>
  );
}
