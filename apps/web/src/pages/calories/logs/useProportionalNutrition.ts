import { useRef, useState } from 'react';

export type NutritionField = 'kcal' | 'protein' | 'fat' | 'carbs';
export type NutritionValues = Record<NutritionField, number | null>;

/** Keeps nutrition tied to stable per-gram values so repeated quantity edits cannot compound rounding. */
export function useProportionalNutrition(
  initialGrams: number | null,
  initialNutrition: NutritionValues,
) {
  const [grams, setGrams] = useState(initialGrams);
  const [nutrition, setNutrition] = useState(initialNutrition);
  const perGram = useRef<NutritionValues>({
    kcal: calculatePerGram(initialNutrition.kcal, initialGrams),
    protein: calculatePerGram(initialNutrition.protein, initialGrams),
    fat: calculatePerGram(initialNutrition.fat, initialGrams),
    carbs: calculatePerGram(initialNutrition.carbs, initialGrams),
  });

  function changeGrams(nextGrams: number | null) {
    setGrams(nextGrams);
    if (nextGrams === null) return;

    setNutrition((current) => ({
      kcal: scaleNutrient(current.kcal, perGram.current.kcal, nextGrams),
      protein: scaleNutrient(current.protein, perGram.current.protein, nextGrams),
      fat: scaleNutrient(current.fat, perGram.current.fat, nextGrams),
      carbs: scaleNutrient(current.carbs, perGram.current.carbs, nextGrams),
    }));
  }

  function changeNutrition(field: NutritionField, value: number | null) {
    setNutrition((current) => ({ ...current, [field]: value }));
    perGram.current[field] = calculatePerGram(value, grams);
  }

  return { changeGrams, changeNutrition, grams, nutrition };
}

function calculatePerGram(value: number | null, grams: number | null) {
  return value === null || grams === null || grams <= 0 ? null : value / grams;
}

function scaleNutrient(currentValue: number | null, perGram: number | null, grams: number) {
  return perGram === null ? currentValue : Math.round(perGram * grams * 100) / 100;
}
