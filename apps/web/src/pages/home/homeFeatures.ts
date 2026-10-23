import {
  NotebookPenIcon,
  BotIcon,
  StickyNoteIcon,
  DumbbellIcon,
  FlameIcon,
  type LucideIcon,
  ScaleIcon,
  UsersRoundIcon,
  CookingPotIcon,
} from 'lucide-react';
import type { Localized } from '@/lib/i18n/locale';

export type HomeFeatureId =
  | 'food'
  | 'weight'
  | 'workouts'
  | 'recipes'
  | 'notes'
  | 'diary'
  | 'friends'
  | 'agent';

export type HomeFeature = {
  id: HomeFeatureId;
  icon: LucideIcon;
  title: Localized;
  description: Localized;
  to: '/calories' | '/weight' | '/workouts' | '/recipes' | '/todos' | '/diary' | '/account';
  /** Section of the target page, used when several features share one page. */
  hash?: string;
};

/**
 * Every user-facing feature, in display order. Both home pages render one card per entry, so
 * adding a feature here keeps the logged-in dashboard and the logged-out page aligned.
 */
export const homeFeatures: HomeFeature[] = [
  {
    id: 'food',
    icon: FlameIcon,
    title: { en: 'Food logging', pl: 'Dziennik jedzenia' },
    description: {
      en: 'Log meals, scan barcodes, and track calories and macros against your goals.',
      pl: 'Zapisuj posiłki, skanuj kody kreskowe i śledź kalorie oraz makroskładniki względem celów.',
    },
    to: '/calories',
  },
  {
    id: 'weight',
    icon: ScaleIcon,
    title: { en: 'Body weight', pl: 'Waga ciała' },
    description: {
      en: 'Log privately and see long-term direction without losing the daily detail.',
      pl: 'Zapisuj prywatnie i obserwuj długoterminowy kierunek bez utraty codziennych szczegółów.',
    },
    to: '/weight',
  },
  {
    id: 'recipes',
    icon: CookingPotIcon,
    title: { en: 'Recipes', pl: 'Przepisy' },
    description: {
      en: 'Build recipes from scanned or searched products, log what you ate, send ingredients to a shopping list, and share recipes with friends.',
      pl: 'Twórz przepisy z zeskanowanych lub wyszukanych produktów, zapisuj zjedzone porcje, wysyłaj składniki na listę zakupów i udostępniaj przepisy znajomym.',
    },
    to: '/recipes',
  },
  {
    id: 'workouts',
    icon: DumbbellIcon,
    title: { en: 'Workouts', pl: 'Treningi' },
    description: {
      en: 'Log sessions and sets, reuse routines, and review your training history.',
      pl: 'Zapisuj treningi i serie, korzystaj z planów i przeglądaj historię treningów.',
    },
    to: '/workouts',
  },
  {
    id: 'notes',
    icon: StickyNoteIcon,
    title: { en: 'Notes', pl: 'Notatki' },
    description: {
      en: 'Keep quick notes and checklists, such as shopping lists.',
      pl: 'Trzymaj szybkie notatki i listy, na przykład listy zakupów.',
    },
    to: '/todos',
  },
  {
    id: 'diary',
    icon: NotebookPenIcon,
    title: { en: 'Diary', pl: 'Dziennik' },
    description: {
      en: 'Write daily entries that are encrypted on your device before they are saved.',
      pl: 'Pisz codzienne wpisy szyfrowane na Twoim urządzeniu przed zapisaniem.',
    },
    to: '/diary',
  },
  {
    id: 'friends',
    icon: UsersRoundIcon,
    title: { en: 'Family and friends', pl: 'Rodzina i znajomi' },
    description: {
      en: 'Invite people you trust and choose what they can see.',
      pl: 'Zaproś zaufane osoby i wybierz, co mogą zobaczyć.',
    },
    to: '/account',
    hash: 'friends',
  },
  {
    id: 'agent',
    icon: BotIcon,
    title: { en: 'AI agent access', pl: 'Dostęp agenta AI' },
    description: {
      en: 'Let an AI assistant read or update your data, with per-feature permissions.',
      pl: 'Pozwól asystentowi AI czytać lub zmieniać Twoje dane, z uprawnieniami dla każdej funkcji.',
    },
    to: '/account',
    hash: 'agent-access',
  },
];
