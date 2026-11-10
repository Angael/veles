import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import css from './Tabs.module.css';

type TabsRootProps<Value extends string> = {
  children: ReactNode;
  className?: string;
  onValueChange: (value: Value) => void;
  value: Value;
};

/** Controlled tabs. Panels stay mounted, so switching tabs never loses typed values or photos. */
export function TabsRoot<Value extends string>({
  children,
  className,
  onValueChange,
  value,
}: TabsRootProps<Value>) {
  return (
    <BaseTabs.Root
      className={clsx(css.root, className)}
      onValueChange={(next: Value) => onValueChange(next)}
      value={value}
    >
      {children}
    </BaseTabs.Root>
  );
}

export function TabsList({ children, label }: { children: ReactNode; label: string }) {
  return (
    <BaseTabs.List aria-label={label} className={css.list}>
      <BaseTabs.Indicator className={css.indicator} />
      {children}
    </BaseTabs.List>
  );
}

type TabsTabProps = { children: ReactNode; icon?: ReactNode; value: string };

export function TabsTab({ children, icon, value }: TabsTabProps) {
  return (
    <BaseTabs.Tab className={css.tab} value={value}>
      {icon}
      {children}
    </BaseTabs.Tab>
  );
}

export function TabsPanel({ children, value }: { children: ReactNode; value: string }) {
  return (
    <BaseTabs.Panel className={css.panel} keepMounted value={value}>
      {children}
    </BaseTabs.Panel>
  );
}
