export type NavbarTarget =
  | { to: '/' }
  | { to: '/diary' }
  | { to: '/recipes' }
  | { params: { id: string }; to: '/recipes/view/$id' };

type NavbarData = {
  label: string;
  upTo?: NavbarTarget | ((match: { params: Record<string, string | undefined> }) => NavbarTarget);
};

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    navbar?: NavbarData;
  }
}
