import {
  Link,
  useCanGoBack,
  useRouter,
  useRouterState,
  type RegisteredRouter,
  type RouterState,
} from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Btn, type BtnVariant } from '@/components/ui/btn/Btn';
import type { NavbarTarget } from '@/lib/routing/staticRouteData';
import { markBackTransition } from '@/lib/viewTransitions'; // view-transitions:

const leafMatchOptions = {
  select: (state: RouterState<RegisteredRouter['routeTree']>) => state.matches.at(-1),
};

/** Resolves the current route's configured `upTo` fallback, if any. */
function useRouteUpTarget(): NavbarTarget | undefined {
  const match = useRouterState(leafMatchOptions);
  const upTo = match?.staticData.navbar?.upTo;
  if (typeof upTo !== 'function') return upTo;
  return upTo({ params: match?.params ?? {}, search: match?.search ?? {} });
}

type Props = {
  className?: string;
  variant?: BtnVariant;
};

/**
 * Back control shared by every route: returns to the previous in-app history entry when one
 * exists, otherwise follows the route's `upTo`. The `href` always points at `upTo` so SSR
 * markup, new-tab clicks, and no-JS fallbacks stay meaningful.
 */
export function RouteBackButton({ className, variant = 'outlineMain' }: Props) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const target = useRouteUpTarget();

  if (!target) return null;

  function goBack(event: MouseEvent) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    markBackTransition(); // view-transitions:
    if (!canGoBack) return;
    event.preventDefault();
    router.history.back();
  }

  return (
    <Btn
      aria-label='Back'
      className={className}
      icon={<ChevronLeftIcon aria-hidden='true' size={18} strokeWidth={2} />}
      iconOnly
      isLink
      render={<Link {...target} activeOptions={{ exact: true }} onClick={goBack} />}
      size='sm'
      variant={variant}
    />
  );
}
