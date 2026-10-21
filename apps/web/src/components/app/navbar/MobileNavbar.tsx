import { Link, useRouterState } from '@tanstack/react-router';
import clsx from 'clsx';
import dock from '@/components/ui/mobile-dock/MobileDock.module.css';
import type { SessionUser } from '@/lib/auth/session.api';
import { useI18n } from '@/lib/i18n/I18nProvider';
import css from './MobileNavbar.module.css';
import { MobileMoreSheet } from './MobileMoreSheet';
import { MOBILE_DOCK_ITEMS } from './navbarItems';

/** Phone dock: labeled direct tabs for daily destinations plus a More sheet listing every section. */
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
      <ul className={css.group}>
        {MOBILE_DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <Link className={css.item} to={item.link}>
                <Icon aria-hidden='true' className={css.icon} size={20} strokeWidth={1.9} />
                <span className={css.label}>{t(item.label)}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <MobileMoreSheet pathname={pathname} />
        </li>
      </ul>
    </nav>
  );
}
