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

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** Uses page-owned chrome without the global application frame. */
    layout?: 'focus';
    navbar?: NavbarData;
  }
}
