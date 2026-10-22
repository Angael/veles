import { type } from 'arktype';
import type { Localized } from './i18n/locale';

/**
 * Feature permissions are shared by all of an account's agent keys. Agents always get the English
 * label; the Account page shows the user's locale.
 */
export const agentFeatures = {
  notes: { label: { en: 'Notes and shopping lists', pl: 'Notatki i listy zakupów' } },
  weight: { label: { en: 'Weight', pl: 'Waga' } },
  workouts: { label: { en: 'Workouts', pl: 'Treningi' } },
  recipes: { label: { en: 'Recipes', pl: 'Przepisy' } },
  calories: { label: { en: 'Food diary', pl: 'Dziennik posiłków' } },
  calorie_goals: { label: { en: 'Nutrition goals', pl: 'Cele żywieniowe' } },
  food_products: { label: { en: 'Food catalog', pl: 'Katalog produktów' } },
} as const satisfies Record<string, { label: Localized }>;

export type AgentFeature = keyof typeof agentFeatures;
export const agentFeatureNames = Object.keys(agentFeatures) as AgentFeature[];
export const agentFeatureType = type.enumerated(...agentFeatureNames);

export type AgentPermissions = Record<AgentFeature, { read: boolean; write: boolean }>;

/** Every feature starts with read and write off until the user opts in. */
export function defaultAgentPermissions(): AgentPermissions {
  return Object.fromEntries(
    agentFeatureNames.map((feature) => [feature, { read: false, write: false }]),
  ) as AgentPermissions;
}
