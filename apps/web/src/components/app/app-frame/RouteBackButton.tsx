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

const leafMatchOptions = {
  select: (state: RouterState<RegisteredRouter['routeTree']>) => state.matches.at(-1),
};

/** Resolves the current route's configured `backFallback` target, if any. */
function useRouteBackFallback(): NavbarTarget | undefined {
  const match = useRouterState(leafMatchOptions);
  const backFallback = match?.staticData.navbar?.backFallback;
  if (typeof backFallback !== 'function') return backFallback;
  return backFallback({ params: match?.params ?? {}, search: match?.search ?? {} });
}

type Props = {
  className?: string;
  variant?: BtnVariant;
};

/**
 * Back control shared by every route: returns to the previous in-app history entry when one
 * exists, otherwise follows the route's `backFallback`. The `href` always points at
 * `backFallback` so SSR markup, new-tab clicks, and no-JS fallbacks stay meaningful.
 */
export function RouteBackButton({ className, variant = 'outlineMain' }: Props) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const target = useRouteBackFallback();

  if (!target) return null;

  function goBack(event: MouseEvent) {
    if (!canGoBack || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
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
