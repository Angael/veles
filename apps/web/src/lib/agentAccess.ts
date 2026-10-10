import { type } from 'arktype';

/** Feature permissions are shared by all of an account's agent keys; writes roll out individually. */
export const agentFeatures = {
  notes: {
    label: 'Notes and shopping lists',
    description: 'Notes, list items, and sharing settings',
    writeAvailable: true,
  },
  weight: { label: 'Weight', description: 'Weight history', writeAvailable: false },
  workouts: {
    label: 'Workouts',
    description: 'Exercises, routines, and logged sessions',
    writeAvailable: false,
  },
  recipes: { label: 'Recipes', description: 'Saved recipes and nutrition', writeAvailable: false },
  calories: {
    label: 'Food diary',
    description: 'Logged meals and nutrition',
    writeAvailable: false,
  },
  calorie_goals: {
    label: 'Nutrition goals',
    description: 'Calorie and macro goals',
    writeAvailable: false,
  },
  food_products: {
    label: 'Food catalog',
    description: 'The shared food catalog used by all accounts',
    writeAvailable: false,
  },
} as const;

export type AgentFeature = keyof typeof agentFeatures;
export const agentFeatureNames = Object.keys(agentFeatures) as AgentFeature[];
export const agentFeatureType = type.enumerated(...agentFeatureNames);

export type AgentPermissions = Record<AgentFeature, { read: boolean; write: boolean }>;

export function defaultAgentPermissions(): AgentPermissions {
  return {
    notes: { read: false, write: false },
    weight: { read: false, write: false },
    workouts: { read: false, write: false },
    recipes: { read: false, write: false },
    calories: { read: false, write: false },
    calorie_goals: { read: false, write: false },
    food_products: { read: false, write: false },
  };
}
