import { format, isPast } from 'date-fns';
import { KeyRoundIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { Label } from '@/components/ui/label/Label';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import {
  useAgentCredentialsQuery,
  useCreateAgentCredentialMutation,
  useRevokeAgentCredentialMutation,
} from './agent-credentials.query';
import css from './AgentAccessCard.module.css';

export function AgentAccessCard() {
  const query = useAgentCredentialsQuery();
  const createMutation = useCreateAgentCredentialMutation();
  const revokeMutation = useRevokeAgentCredentialMutation();
  const [token, setToken] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <Card as='section' className={css.card}>
      <header>
        <h2>Agent access</h2>
        <p>
          Let an agent read your Veles content. Tokens cannot change data and expire after 90 days.
        </p>
      </header>
      {query.data ? (
        <Label text='MCP endpoint'>
          <TextInput
            readOnly
            value={query.data.endpoint}
            onFocus={(event) => event.target.select()}
          />
        </Label>
      ) : null}
      <TypedForm
        className={css.form}
        onSubmit={async (form) => {
          setFeedback(null);
          try {
            const result = await createMutation.mutateAsync(form.string('name'));
            setToken(result.token);
            createMutation.reset();
          } catch (error) {
            setFeedback(error instanceof Error ? error.message : 'Token could not be created.');
          }
        }}
      >
        <Label text='Token name'>
          <TextInput name='name' defaultValue='Hermes VPS' maxLength={80} required />
        </Label>
        <Btn
          type='submit'
          icon={<KeyRoundIcon aria-hidden='true' />}
          loading={createMutation.isPending}
          disabled={token !== null || query.isError}
        >
          Create read-only token
        </Btn>
      </TypedForm>
      {token ? (
        <div className={css.secret}>
          <Label text='Copy this token now. It will only be shown once.'>
            <TextInput readOnly value={token} onFocus={(event) => event.target.select()} />
          </Label>
          <Btn size='sm' variant='outlineMain' onClick={() => setToken(null)}>
            Done copying
          </Btn>
        </div>
      ) : null}
      {feedback ? <p role='alert'>{feedback}</p> : null}
      {query.isPending ? <p role='status'>Loading agent access…</p> : null}
      {query.isError ? <p role='alert'>Agent access could not be loaded.</p> : null}
      {query.data?.credentials.length === 0 ? <p>No active agent credentials.</p> : null}
      <ul className={css.tokens}>
        {query.data?.credentials.map((credential) => (
          <li key={credential.id}>
            <div>
              <strong>{credential.name}</strong>
              <small>
                {isPast(credential.expiresAt) ? 'Expired' : 'Read-only · Expires'}{' '}
                {format(credential.expiresAt, 'yyyy-MM-dd')}
              </small>
            </div>
            <Btn
              size='sm'
              variant='outlineDanger'
              loading={revokeMutation.isPending}
              onClick={() => {
                setToken(null);
                revokeMutation.mutate(credential.id);
              }}
            >
              Revoke
            </Btn>
          </li>
        ))}
      </ul>
    </Card>
  );
}
