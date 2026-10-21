import type { ComponentType } from 'react';
import type { Localized } from '@/lib/i18n/locale';

export type NavbarTarget =
  | { to: '/' }
  | { search?: { date?: string }; to: '/calories' }
  | { to: '/diary' }
  | { to: '/recipes' }
  | { to: '/weight' }
  | { to: '/workouts' }
  | { params: { id: string }; to: '/recipes/view/$id' }
  | { params: { date: string }; to: '/weight/$date' };

export type NavbarTargetMatch = {
  params: Record<string, string | undefined>;
  search: Record<string, unknown>;
};

type NavbarData = {
  label: Localized;
  /**
   * Back target used when there is no in-app history entry to return to. Also the back link's
   * `href`, and its presence is what makes the route show a back button.
   */
  backFallback?: NavbarTarget | ((match: NavbarTargetMatch) => NavbarTarget);
  /** Task header buttons after the title, e.g. a menu of rare page actions. */
  Actions?: ComponentType;
};

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
