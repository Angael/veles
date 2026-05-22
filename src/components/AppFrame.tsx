import { Outlet } from '@tanstack/react-router'
import { NavMenu } from '@/components/NavMenu'
import { clientEnv } from '@/lib/env/client'
import styles from '@/styles/app.module.css'

export function AppFrame() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <strong>{clientEnv.appName}</strong>
            <span>Fresh TanStack Start reset with Better Auth, Drizzle, and R2-ready envs.</span>
          </div>
          <NavMenu />
        </header>
        <Outlet />
      </div>
    </div>
  )
}
