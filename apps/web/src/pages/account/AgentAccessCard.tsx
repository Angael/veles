import { format } from 'date-fns';
import { KeyRoundIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { Label } from '@/components/ui/label/Label';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { useApiKeysQuery, useCreateApiKeyMutation, useDeleteApiKeyMutation } from './account.query';
import { FriendRow } from './FriendRow';
import { AgentPermissions } from './AgentPermissions';
import { AgentSetupGuide } from './AgentSetupGuide';
import css from './AccountPage.module.css';

interface AgentAccessCardProps {
  userName: string;
}

export function AgentAccessCard({ userName }: AgentAccessCardProps) {
  const [newKey, setNewKey] = useState<string | null>(null);
  const keysQuery = useApiKeysQuery();
  const createMutation = useCreateApiKeyMutation();
  const deleteMutation = useDeleteApiKeyMutation();

  return (
    <Card aria-busy={keysQuery.isPending} as='section' className={css.friendsCard} data-appear='1'>
      <header className={css.sectionHeader}>
        <div>
          <h2>Agent access</h2>
          <p>Choose what agents like Hermes can access through MCP. Keys expire after 90 days.</p>
          <p>
            Each person creates their own key. One agent can hold keys from several people; it adds
            one connection per key.
          </p>
        </div>
      </header>

      <AgentPermissions />

      <TypedForm
        className={css.inviteForm}
        onSubmit={async (form) => {
          const created = await createMutation.mutateAsync(form.string('name'));
          setNewKey(created.key);
        }}
      >
        <Label text='Key name'>
          <TextInput defaultValue='Hermes' maxLength={32} name='name' required />
        </Label>
        <Btn
          icon={<KeyRoundIcon aria-hidden='true' />}
          loading={createMutation.isPending}
          type='submit'
        >
          Create key
        </Btn>
      </TypedForm>

      {createMutation.error ? (
        <p className={css.feedback} role='alert'>
          {createMutation.error.message}
        </p>
      ) : null}

      {newKey ? <AgentSetupGuide apiKey={newKey} userName={userName} /> : null}

      {keysQuery.data?.length ? (
        <ul>
          {keysQuery.data.map((key) => (
            <FriendRow
              actions={
                <Btn
                  aria-label={`Revoke ${key.name ?? 'key'}`}
                  icon={<TrashIcon aria-hidden='true' />}
                  iconOnly
                  loading={deleteMutation.isPending && deleteMutation.variables === key.id}
                  onClick={() => deleteMutation.mutate(key.id)}
                  variant='ghostDanger'
                />
              }
              detail={`${key.start ?? ''}… · expires ${key.expiresAt ? format(key.expiresAt, 'yyyy-MM-dd') : 'never'}`}
              key={key.id}
              name={key.name ?? 'Unnamed key'}
            />
          ))}
        </ul>
      ) : null}

      {keysQuery.data?.length === 0 ? <p className={css.emptyState}>No agent keys yet.</p> : null}
    </Card>
  );
}
