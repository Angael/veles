import { Link, Outlet } from '@tanstack/react-router';
import { NavMenu } from '@/components/nav-menu/NavMenu';
import { MobileNavMenu } from '@/components/nav-menu/MobileNavMenu';
import { clientEnv } from '@/lib/env/client';
import css from './AppFrame.module.css';

export function AppFrame() {
  return (
    <div className={css.page}>
      <div className={css.shell}>
        <header className={css.header}>
          <div className={css.brand}>
            <Link to='/'>
              <strong>{clientEnv.appName}</strong>
            </Link>
          </div>
          <NavMenu />
        </header>
        <Outlet />
        <MobileNavMenu />
      </div>
    </div>
  );
}
