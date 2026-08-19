const nutritionNumberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

export function formatNutritionNumber(value: number) {
  return nutritionNumberFormatter.format(value);
}
