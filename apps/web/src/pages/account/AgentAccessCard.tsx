import { BotIcon, ChevronDownIcon, PlusIcon, ShieldCheckIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { agentFeatureNames, agentFeatures } from '@/lib/agentAccess';
import {
  useAgentPermissionsQuery,
  useApiKeysQuery,
  useCreateApiKeyMutation,
} from './account.query';
import { AgentKeyList } from './AgentKeyList';
import { AgentPermissions } from './AgentPermissions';
import { AgentSetupGuide } from './AgentSetupGuide';
import css from './AgentAccessCard.module.css';

interface AgentAccessCardProps {
  userName: string;
}

export function AgentAccessCard({ userName }: AgentAccessCardProps) {
  const [newKey, setNewKey] = useState<string | null>(null);
  const keysQuery = useApiKeysQuery();
  const createMutation = useCreateApiKeyMutation();
  const keyCount = keysQuery.data?.length ?? 0;

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
          <p>Let an AI assistant like Hermes read or update your Veles data.</p>
        </div>
        {keysQuery.data ? (
          <span className={css.status} data-active={keyCount > 0 || undefined}>
            {keyCount > 0 ? `${keyCount} active ${keyCount === 1 ? 'key' : 'keys'}` : 'Off'}
          </span>
        ) : null}
      </header>

      {newKey ? (
        <AgentSetupGuide apiKey={newKey} onDone={() => setNewKey(null)} userName={userName} />
      ) : null}

      <section aria-labelledby='agent-keys-title' className={css.block}>
        <div className={css.blockHead}>
          <h3 id='agent-keys-title'>Keys</h3>
          <p>Give each agent its own key. Keys do not expire; revoke one to cut off access.</p>
        </div>

        <AgentKeyList />

        <TypedForm
          className={css.createForm}
          onSubmit={async (form) => {
            const created = await createMutation.mutateAsync(form.string('name'));
            setNewKey(created.key);
          }}
        >
          <TextInput
            aria-label='Key name'
            defaultValue='Hermes'
            maxLength={32}
            name='name'
            placeholder='Agent name'
            required
          />
          <Btn
            icon={<PlusIcon aria-hidden='true' />}
            loading={createMutation.isPending}
            type='submit'
          >
            New key
          </Btn>
        </TypedForm>

        {createMutation.error ? (
          <p className={css.error} role='alert'>
            {createMutation.error.message}
          </p>
        ) : null}
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
