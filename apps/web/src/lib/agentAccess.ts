import { type } from 'arktype';

/** Feature permissions are shared by all of an account's agent keys; writes roll out individually. */
export const agentFeatures = {
  notes: { label: 'Notes and shopping lists', writeAvailable: true },
  weight: { label: 'Weight', writeAvailable: false },
  workouts: { label: 'Workouts', writeAvailable: false },
  recipes: { label: 'Recipes', writeAvailable: false },
  calories: { label: 'Food diary', writeAvailable: false },
  calorie_goals: { label: 'Nutrition goals', writeAvailable: false },
  food_products: { label: 'Food catalog', writeAvailable: false },
} as const;

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
