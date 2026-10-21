import { Link, useRouterState } from '@tanstack/react-router';
import clsx from 'clsx';
import dock from '@/components/ui/mobile-dock/MobileDock.module.css';
import type { SessionUser } from '@/lib/auth/session.api';
import { useI18n } from '@/lib/i18n/I18nProvider';
import css from './MobileNavbar.module.css';
import { NAVBAR_ITEMS } from './navbarItems';

/**
 * Phone bottom dock with every primary destination one tap away. Each link shows its icon and a
 * visible label; the current page gets a pill indicator and `aria-current="page"`.
 */
export function MobileNavbar({ user }: { user: SessionUser | null }) {
  const { t } = useI18n();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (!user) {
    return null;
  }

  return (
    <nav
      aria-label={t({ en: 'Primary mobile navigation', pl: 'Główna nawigacja mobilna' })}
      className={clsx(dock.dock, css.wrapper)}
    >
      <ul className={css.list}>
        {NAVBAR_ITEMS.map((item) => {
          const active = item.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
          const Icon = item.icon;

          return (
            <li key={item.key}>
              <Link
                aria-current={active ? 'page' : undefined}
                className={css.item}
                data-active={active || undefined}
                to={item.link}
              >
                <span aria-hidden='true' className={css.indicator}>
                  <Icon size={20} strokeWidth={1.9} />
                </span>
                <span className={css.label}>{t(item.label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
