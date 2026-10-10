import { BotIcon, ChevronDownIcon, ShieldCheckIcon } from 'lucide-react';
import { Card } from '@/components/ui/card/Card';
import { agentFeatureNames, agentFeatures } from '@/lib/agentAccess';
import { useAgentPermissionsQuery, useApiKeysQuery } from './account.query';
import { AgentKeyList } from './AgentKeyList';
import { AgentPermissions } from './AgentPermissions';
import { CreateAgentKeyDialog } from './CreateAgentKeyDialog';
import css from './AgentAccessCard.module.css';

interface AgentAccessCardProps {
  userName: string;
}

export function AgentAccessCard({ userName }: AgentAccessCardProps) {
  const keysQuery = useApiKeysQuery();

  return (
    <Card
      aria-busy={keysQuery.isPending}
      as='section'
      className={css.card}
      data-appear='1'
      tone='primary'
    >
      <header className={css.header}>
        <span aria-hidden='true' className={css.badge}>
          <BotIcon />
        </span>
        <div>
          <h2>AI Agent access</h2>
          <p>Let an AI assistant like Vel read or update your Veles data.</p>
        </div>
      </header>

      <section aria-labelledby='agent-keys-title' className={css.block}>
        <div className={css.blockHead}>
          <div>
            <h3 id='agent-keys-title'>Keys</h3>
            <p>Give each agent its own key. Keys do not expire; revoke one to cut off access.</p>
          </div>
          <CreateAgentKeyDialog userName={userName} />
        </div>

        <AgentKeyList />
      </section>

      <details className={css.disclosure}>
        <summary>
          <ShieldCheckIcon aria-hidden='true' />
          <span>What AI can access</span>
          <PermissionSummary />
          <ChevronDownIcon aria-hidden='true' className={css.chevron} />
        </summary>
        <AgentPermissions />
      </details>
    </Card>
  );
}

/** Shows how many features are open so the collapsed permissions row still says something useful. */
function PermissionSummary() {
  const permissions = useAgentPermissionsQuery().data;
  if (!permissions) return <small />;
  const reads = agentFeatureNames.filter((feature) => permissions[feature].read).length;
  const writes = agentFeatureNames.filter(
    (feature) => agentFeatures[feature].writeAvailable && permissions[feature].write,
  ).length;
  if (!reads && !writes) return <small>Nothing shared</small>;
  return (
    <small>
      {reads}/{agentFeatureNames.length} read · {writes} write
    </small>
  );
}
