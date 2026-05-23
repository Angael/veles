import { Outlet } from '@tanstack/react-router';
import { NavMenu } from '@/components/NavMenu';
import { clientEnv } from '@/lib/env/client';
import css from './AppFrame.module.css';

export function AppFrame() {
  return (
    <div className={css.page}>
      <div className={css.shell}>
        <header className={css.header}>
          <div className={css.brand}>
            <strong>{clientEnv.appName}</strong>
          </div>
          <NavMenu />
        </header>
        <Outlet />
      </div>
    </div>
  );
}
