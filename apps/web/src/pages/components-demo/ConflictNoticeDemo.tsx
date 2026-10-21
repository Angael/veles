import { ConflictNotice } from '@/components/ui/conflict-notice/ConflictNotice';

export function ConflictNoticeDemo() {
  return (
    <section>
      <h2>ConflictNotice</h2>
      <ConflictNotice onKeepMine={() => undefined} onLoadLatest={() => undefined} />
    </section>
  );
}
