import { Link, useRouterState } from '@tanstack/react-router';
import clsx from 'clsx';
import { useState } from 'react';
import dock from '@/components/ui/mobile-dock/MobileDock.module.css';
import type { SessionUser } from '@/lib/auth/session.api';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { MobileMoreSheet } from './MobileMoreSheet';
import { MobileNavCustomizer } from './MobileNavCustomizer';
import css from './MobileNavbar.module.css';
import { orderedNavbarItems, useMobileNavPrefs } from './mobileNavPrefs';
import { isNavbarItemActive } from './navbarItems';
import { useLongPress } from './useLongPress';

/**
 * Phone bottom dock: the user's pinned destinations with icons and labels, then More with every
 * section. Press and hold the dock (or use More) to choose and reorder the pinned links (#251).
 */
export function MobileNavbar({ user }: { user: SessionUser | null }) {
  const { t } = useI18n();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const prefs = useMobileNavPrefs();
  const [customizing, setCustomizing] = useState(false);
  const longPress = useLongPress(() => setCustomizing(true));

  if (!user) {
    return null;
  }

  const items = orderedNavbarItems(prefs);
  const pinned = items.filter((item) => prefs.pinned.includes(item.key));
  const rest = items.filter((item) => !prefs.pinned.includes(item.key));

  return (
    <nav
      aria-label={t({ en: 'Primary mobile navigation', pl: 'Główna nawigacja mobilna' })}
      className={clsx(dock.dock, css.wrapper)}
      data-pressing={longPress.pressing || undefined}
      {...longPress.handlers}
    >
      <ul className={css.list}>
        {pinned.map((item) => {
          const active = isNavbarItemActive(item, pathname);
          const Icon = item.icon;

          return (
            <li key={item.key}>
              <Link
                aria-current={active ? 'page' : undefined}
                className={css.item}
                data-active={active || undefined}
                draggable={false}
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
        <li>
          <MobileMoreSheet
            hiddenItems={rest}
            items={items}
            onCustomize={() => setCustomizing(true)}
            pathname={pathname}
          />
        </li>
      </ul>
      <MobileNavCustomizer onOpenChange={setCustomizing} open={customizing} prefs={prefs} />
    </nav>
  );
}
