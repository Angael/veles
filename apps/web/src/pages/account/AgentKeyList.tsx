import { format, formatDistanceToNow } from 'date-fns';
import { KeyRoundIcon, TrashIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Skeleton } from '@/components/ui/skeleton/Skeleton';
import { useApiKeysQuery, useDeleteApiKeyMutation } from './account.query';
import css from './AgentAccessCard.module.css';

/** Lists the account's agent keys with last use, so stale keys are easy to spot and revoke. */
export function AgentKeyList() {
  const keysQuery = useApiKeysQuery();
  const deleteMutation = useDeleteApiKeyMutation();

  if (keysQuery.isPending) {
    return (
      <ul className={css.keyList}>
        <li className={css.keyRow}>
          <Skeleton className={css.keyIcon} />
          <Skeleton className={css.keySkeleton} />
        </li>
      </ul>
    );
  }

  if (!keysQuery.data?.length) {
    return (
      <p className={css.empty}>
        <KeyRoundIcon aria-hidden='true' />
        No keys yet. Create one to connect your first agent.
      </p>
    );
  }

  return (
    <ul className={css.keyList}>
      {keysQuery.data.map((key) => {
        const name = key.name ?? 'Unnamed key';
        return (
          <li className={css.keyRow} key={key.id}>
            <span aria-hidden='true' className={css.keyIcon}>
              <KeyRoundIcon />
            </span>
            <div className={css.keyInfo}>
              <strong>{name}</strong>
              <span>
                <code>{key.start ?? 'vls_'}…</code>
                <span>
                  {key.lastRequest
                    ? `Used ${formatDistanceToNow(key.lastRequest, { addSuffix: true })}`
                    : 'Never used'}
                </span>
                <span>Created {format(key.createdAt, 'd MMM yyyy')}</span>
              </span>
            </div>
            <Btn
              aria-label={`Revoke ${name}`}
              icon={<TrashIcon aria-hidden='true' />}
              iconOnly
              loading={deleteMutation.isPending && deleteMutation.variables === key.id}
              onClick={() => deleteMutation.mutate(key.id)}
              variant='ghostDanger'
            />
          </li>
        );
      })}
    </ul>
  );
}
