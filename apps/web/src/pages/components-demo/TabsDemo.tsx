import { useState } from 'react';
import { TabsList, TabsPanel, TabsRoot, TabsTab } from '@/components/ui/tabs/Tabs';

export function TabsDemo() {
  const [tab, setTab] = useState<'first' | 'second'>('first');

  return (
    <section>
      <h2>Tabs</h2>
      <TabsRoot onValueChange={setTab} value={tab}>
        <TabsList label='Demo tabs'>
          <TabsTab value='first'>First</TabsTab>
          <TabsTab value='second'>Second</TabsTab>
        </TabsList>
        <TabsPanel value='first'>First panel</TabsPanel>
        <TabsPanel value='second'>Second panel</TabsPanel>
      </TabsRoot>
    </section>
  );
}
