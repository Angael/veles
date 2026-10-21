import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Link, useRouterState } from '@tanstack/react-router';
import clsx from 'clsx';
import { useId, useState } from 'react';
import dock from '@/components/ui/mobile-dock/MobileDock.module.css';
import type { SessionUser } from '@/lib/auth/session.api';
import { useI18n } from '@/lib/i18n/I18nProvider';
import css from './MobileNavbar.module.css';
import { isNavbarItemActive, NAVBAR_SECTIONS, type NavbarSection } from './navbarItems';

type SectionKey = NavbarSection['key'];

/** The section the user picked while on `pathname`; `null` means follow the current page. */
type SectionChoice = { pathname: string; section: SectionKey | null };

/**
 * Two-level phone dock: section controls switch which two destination links the row above shows,
 * and only those links navigate. The shown section follows the current page; a user's pick is
 * discarded on the first render with a new pathname, so links, back/forward and deep links always
 * resync it and returning to an earlier pathname never revives an old pick.
 */
export function MobileNavbar({ user }: { user: SessionUser | null }) {
  const { t } = useI18n();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [choice, setChoice] = useState<SectionChoice>({ pathname, section: null });
  const linksId = useId();

  // Adjust state while rendering (not in an effect): React re-renders before committing, so the
  // stale pick never paints, and it is gone for good rather than hidden until the path matches again.
  if (choice.pathname !== pathname) {
    setChoice({ pathname, section: null });
  }

  if (!user) {
    return null;
  }

  const currentSection = NAVBAR_SECTIONS.find((section) =>
    section.items.some((item) => isNavbarItemActive(item, pathname)),
  );
  const shownKey =
    (choice.pathname === pathname ? choice.section : null) ??
    currentSection?.key ??
    NAVBAR_SECTIONS[0].key;
  const shown = NAVBAR_SECTIONS.find((section) => section.key === shownKey) ?? NAVBAR_SECTIONS[0];

  function selectSection(value: SectionKey[]) {
    // Single selection: pressing the shown section again keeps it instead of clearing the row.
    const [next] = value;
    if (next) setChoice({ pathname, section: next });
  }

  return (
    <nav
      aria-label={t({ en: 'Primary mobile navigation', pl: 'Główna nawigacja mobilna' })}
      className={clsx(dock.dock, css.wrapper)}
    >
      <ToggleGroup
        aria-label={t({ en: 'Sections', pl: 'Sekcje' })}
        className={css.sections}
        onValueChange={selectSection}
        value={[shown.key]}
      >
        {NAVBAR_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isCurrent = section.key === currentSection?.key;
          return (
            <Toggle
              key={section.key}
              aria-controls={linksId}
              className={css.section}
              data-current={isCurrent ? '' : undefined}
              value={section.key}
            >
              <Icon aria-hidden='true' size={20} strokeWidth={1.9} />
              <span className={css.sectionLabel}>{t(section.label)}</span>
              {isCurrent ? (
                <span className={css.visuallyHidden}>
                  {t({ en: ', current page here', pl: ', tu jest bieżąca strona' })}
                </span>
              ) : null}
            </Toggle>
          );
        })}
      </ToggleGroup>

      <ul aria-label={t(shown.label)} className={css.links} id={linksId}>
        {shown.items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <Link
                activeOptions={{ includeSearch: false }}
                aria-current={isNavbarItemActive(item, pathname) ? 'page' : undefined}
                className={css.link}
                to={item.link}
              >
                <Icon aria-hidden='true' size={18} strokeWidth={1.9} />
                <span>{t(item.label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
