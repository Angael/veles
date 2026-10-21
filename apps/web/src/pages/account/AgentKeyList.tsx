import { formatDistanceToNow } from 'date-fns';
import { KeyRoundIcon, TrashIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Skeleton } from '@/components/ui/skeleton/Skeleton';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useApiKeysQuery, useDeleteApiKeyMutation } from './account.query';
import css from './AgentAccessCard.module.css';

/** Lists the account's agent keys with last use, so stale keys are easy to spot and revoke. */
export function AgentKeyList() {
  const { dateLocale, formatDate, t } = useI18n();
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

  if (keysQuery.isError) {
    return (
      <div className={css.empty} role='alert'>
        <KeyRoundIcon aria-hidden='true' />
        {t({ en: 'Could not load your keys.', pl: 'Nie udało się wczytać kluczy.' })}
        <Btn
          loading={keysQuery.isFetching}
          onClick={() => void keysQuery.refetch()}
          size='sm'
          variant='outlineMain'
        >
          {t({ en: 'Try again', pl: 'Spróbuj ponownie' })}
        </Btn>
      </div>
    );
  }

  if (!keysQuery.data.length) {
    return (
      <p className={css.empty}>
        <KeyRoundIcon aria-hidden='true' />
        {t({
          en: 'No keys yet. Create one to connect your first agent.',
          pl: 'Nie masz jeszcze kluczy. Utwórz klucz, aby połączyć pierwszego agenta.',
        })}
      </p>
    );
  }

  return (
    <ul className={css.keyList}>
      {keysQuery.data.map((key) => {
        const name = key.name ?? t({ en: 'Unnamed key', pl: 'Klucz bez nazwy' });
        const created = formatDate(key.createdAt, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const lastUsed = key.lastRequest
          ? formatDistanceToNow(key.lastRequest, { addSuffix: true, locale: dateLocale })
          : null;
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
                  {lastUsed
                    ? t({ en: `Used ${lastUsed}`, pl: `Użyty ${lastUsed}` })
                    : t({ en: 'Never used', pl: 'Jeszcze nieużyty' })}
                </span>
                <span>{t({ en: `Created ${created}`, pl: `Utworzony ${created}` })}</span>
              </span>
            </div>
            <Btn
              aria-label={t({ en: `Revoke ${name}`, pl: `Unieważnij ${name}` })}
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
