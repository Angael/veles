import type { BarcodeLookupResult, CalorieFood } from './calories.api';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { CameraIcon, PackagePlusIcon, SearchIcon, UtensilsIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextInput } from '@/components/text-input/TextInput';
import { toastManager } from '@/components/toast/toastManager';
import { BarcodeScanner } from './BarcodeScanner';
import { createFoodProduct, lookupFoodByBarcode, recordFood } from './calories.api';
import css from './CaloriesPage.module.css';

export function FoodCapture({ recentFoods }: { recentFoods: CalorieFood[] }) {
  const [barcode, setBarcode] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [result, setResult] = useState<BarcodeLookupResult | null>(null);
  const lookupMutation = useMutation({
    mutationFn: lookupFoodByBarcode,
    onError: () =>
      notifyFailure('Barcode lookup failed', 'Check your connection and try the barcode again.'),
    onSuccess: setResult,
  });

  function lookup(value: string) {
    const normalized = value.replace(/\D/g, '');
    setBarcode(normalized);
    setResult(null);
    if (normalized) lookupMutation.mutate({ data: { barcode: normalized } });
  }

  return (
    <Card as='section' className={css.captureCard}>
      <div className={css.sectionHeading}>
        <div>
          <h2>Add food</h2>
          <p>Scan packaging, enter a barcode, or choose a recent food.</p>
        </div>
      </div>
      <form
        className={css.barcodeForm}
        onSubmit={(event) => {
          event.preventDefault();
          lookup(barcode);
        }}
      >
        <label>
          <span>Barcode number</span>
          <TextInput
            autoComplete='off'
            inputMode='numeric'
            onChange={(event) => setBarcode(event.target.value.replace(/\D/g, ''))}
            pattern='[0-9]+'
            placeholder='e.g. 5901234123457'
            required
            value={barcode}
          />
        </label>
        <Btn
          disabled={!barcode || lookupMutation.isPending}
          icon={<SearchIcon aria-hidden='true' />}
          loading={lookupMutation.isPending}
          type='submit'
        >
          Find food
        </Btn>
        <Btn
          icon={<CameraIcon aria-hidden='true' />}
          onClick={() => setScannerOpen((open) => !open)}
          type='button'
          variant='outlineMain'
        >
          {scannerOpen ? 'Close camera' : 'Use camera'}
        </Btn>
      </form>

      {scannerOpen ? (
        <BarcodeScanner
          onClose={() => setScannerOpen(false)}
          onDetected={(code) => {
            setScannerOpen(false);
            lookup(code);
          }}
        />
      ) : null}
      {result?.status === 'found' ? <FoundFood food={result.food} /> : null}
      {result?.status === 'notFound' ? (
        <CreateFood barcode={barcode} onCreated={(food) => setResult({ status: 'found', food })} />
      ) : null}
      {!result && recentFoods.length > 0 ? <RecentFoods foods={recentFoods} /> : null}
    </Card>
  );
}

function FoundFood({ food }: { food: CalorieFood }) {
  const router = useRouter();
  const [grams, setGrams] = useState<number | null>(100);
  const mutation = useMutation({
    mutationFn: recordFood,
    onError: () =>
      notifyFailure('Could not add food', 'The entry was not saved. Please try again.'),
    onSuccess: async () => {
      await router.invalidate();
      toastManager.add({
        title: 'Food added',
        description: `${food.name} is in today’s log.`,
        type: 'success',
      });
    },
  });
  const kcal = grams === null ? 0 : (food.kcalPer100g * grams) / 100;

  return (
    <div className={css.foundFood}>
      <div className={css.foodIdentity}>
        <PackagePlusIcon aria-hidden='true' />
        <div>
          <strong>{food.name}</strong>
          <span>
            {food.brand || 'Veles food'} · {format(food.kcalPer100g)} kcal / 100 g
          </span>
        </div>
      </div>
      <form
        className={css.gramsForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (grams !== null) mutation.mutate({ data: { productId: food.id, grams } });
        }}
      >
        <label>
          <span>Amount in grams</span>
          <NumberInput min={0.1} onValueChange={setGrams} required step={1} value={grams} />
        </label>
        <div className={css.energyPreview}>
          <span>This adds</span>
          <strong>{format(kcal)} kcal</strong>
        </div>
        <Btn disabled={grams === null || grams <= 0} loading={mutation.isPending} type='submit'>
          Add to today
        </Btn>
      </form>
    </div>
  );
}
function CreateFood({
  barcode,
  onCreated,
}: {
  barcode: string;
  onCreated: (food: CalorieFood) => void;
}) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [kcal, setKcal] = useState<number | null>(null);
  const [protein, setProtein] = useState<number | null>(null);
  const [carbs, setCarbs] = useState<number | null>(null);
  const [fat, setFat] = useState<number | null>(null);
  const mutation = useMutation({
    mutationFn: createFoodProduct,
    onError: () =>
      notifyFailure('Could not create food', 'Check the nutrition values and try again.'),
    onSuccess: onCreated,
  });

  return (
    <div className={css.createFood}>
      <div>
        <h3>Not in Veles yet</h3>
        <p>
          Add the label values per 100 g. This creates a shared Veles food, then you can log your
          serving.
        </p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (kcal !== null)
            mutation.mutate({
              data: {
                barcode,
                name: name.trim(),
                brand: brand.trim() || undefined,
                kcalPer100g: kcal,
                proteinPer100g: protein ?? undefined,
                carbsPer100g: carbs ?? undefined,
                fatPer100g: fat ?? undefined,
              },
            });
        }}
      >
        <div className={css.foodDetails}>
          <label>
            <span>Food name</span>
            <TextInput onChange={(event) => setName(event.target.value)} required value={name} />
          </label>
          <label>
            <span>
              Brand <small>optional</small>
            </span>
            <TextInput onChange={(event) => setBrand(event.target.value)} value={brand} />
          </label>
        </div>
        <div className={css.nutritionGrid}>
          <NutritionInput label='Calories' onChange={setKcal} required value={kcal} />
          <NutritionInput label='Protein' onChange={setProtein} value={protein} />
          <NutritionInput label='Carbs' onChange={setCarbs} value={carbs} />
          <NutritionInput label='Fat' onChange={setFat} value={fat} />
        </div>
        <Btn
          disabled={!name.trim() || kcal === null || kcal < 0}
          icon={<PackagePlusIcon aria-hidden='true' />}
          loading={mutation.isPending}
          type='submit'
        >
          Create Veles food
        </Btn>
      </form>
    </div>
  );
}

function NutritionInput({
  label,
  onChange,
  required,
  value,
}: {
  label: string;
  onChange: (value: number | null) => void;
  required?: boolean;
  value: number | null;
}) {
  return (
    <label>
      <span>
        {label} {!required ? <small>optional</small> : null}
      </span>
      <NumberInput
        min={0}
        onValueChange={onChange}
        placeholder={label === 'Calories' ? 'kcal' : 'g'}
        required={required}
        step={0.1}
        value={value}
      />
    </label>
  );
}

function RecentFoods({ foods }: { foods: CalorieFood[] }) {
  return (
    <div className={css.recentFoods}>
      <h3>Recent foods</h3>
      <div>
        {foods.map((food) => (
          <div className={css.recentFood} key={food.id}>
            <UtensilsIcon aria-hidden='true' />
            <span>
              <strong>{food.name}</strong>
              <small>{format(food.kcalPer100g)} kcal / 100 g</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function format(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}
function notifyFailure(title: string, description: string) {
  toastManager.add({ title, description, priority: 'high', type: 'error' });
}
