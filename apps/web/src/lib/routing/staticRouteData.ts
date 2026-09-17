export type NavbarTarget =
  | { to: '/' }
  | { to: '/calories' }
  | { to: '/diary' }
  | { to: '/recipes' }
  | { to: '/weight' }
  | { params: { id: string }; to: '/recipes/view/$id' };

type NavbarData = {
  label: string;
  upTo?: NavbarTarget | ((match: { params: Record<string, string | undefined> }) => NavbarTarget);
};

type FocusBackTarget =
  | NavbarTarget
  | ((match: { params: Record<string, string | undefined> }) => NavbarTarget);

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** Uses page-owned chrome while retaining an explicit route back to the surrounding flow. */
    backTo?: FocusBackTarget;
    layout?: 'focus';
    navbar?: NavbarData;
  }
}
