import type { Localized } from '@/lib/i18n/locale';

/** Lowercase macro names, in display order: protein, fat, carbs. */
export const MACRO_LABELS = {
  protein: { en: 'protein', pl: 'białko' },
  fat: { en: 'fat', pl: 'tłuszcz' },
  carbs: { en: 'carbs', pl: 'węglowodany' },
} as const satisfies Record<'protein' | 'fat' | 'carbs', Localized>;
