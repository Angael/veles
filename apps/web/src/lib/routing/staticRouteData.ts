export type NavbarTarget =
  | { to: '/' }
  | { search?: { date?: string }; to: '/calories' }
  | { to: '/diary' }
  | { to: '/recipes' }
  | { to: '/weight' }
  | { params: { id: string }; to: '/recipes/view/$id' };

type NavbarTargetMatch = {
  params: Record<string, string | undefined>;
  search: Record<string, unknown>;
};

type NavbarData = {
  label: string;
  /** Fallback back target, used only when there is no in-app history entry to return to. */
  upTo?: NavbarTarget | ((match: NavbarTargetMatch) => NavbarTarget);
};

/** Falls back to the calorie diary day the current flow was opened for. */
export function caloriesDayTarget({ search }: NavbarTargetMatch): NavbarTarget {
  return {
    search: typeof search.date === 'string' ? { date: search.date } : {},
    to: '/calories',
  };
}

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /**
     * `task`: sticky back + title header, no primary navigation.
     * `immersive`: no application chrome; the page renders its own `RouteBackButton`.
     * Omitted: section chrome with logo or title and primary navigation.
     */
    layout?: 'task' | 'immersive';
    navbar?: NavbarData;
  }
}
