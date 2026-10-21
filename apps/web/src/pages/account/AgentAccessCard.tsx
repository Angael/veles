import { BotIcon, ChevronDownIcon, ShieldCheckIcon } from 'lucide-react';
import { Card } from '@/components/ui/card/Card';
import { agentFeatureNames } from '@/lib/agentAccess';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useAgentPermissionsQuery, useApiKeysQuery } from './account.query';
import { AgentKeyList } from './AgentKeyList';
import { AgentPermissions } from './AgentPermissions';
import { CreateAgentKeyDialog } from './CreateAgentKeyDialog';
import css from './AgentAccessCard.module.css';

interface AgentAccessCardProps {
  userName: string;
}

export function AgentAccessCard({ userName }: AgentAccessCardProps) {
  const { t } = useI18n();
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
          <h2>{t({ en: 'AI Agent access', pl: 'Dostęp dla agentów AI' })}</h2>
          <p>
            {t({
              en: 'Let an AI assistant like Vel read or update your Veles data.',
              pl: 'Pozwól asystentowi AI, takiemu jak Vel, odczytywać lub zmieniać Twoje dane w Veles.',
            })}
          </p>
        </div>
      </header>

      <section aria-labelledby='agent-keys-title' className={css.block}>
        <div className={css.blockHead}>
          <h3 id='agent-keys-title'>{t({ en: 'Keys', pl: 'Klucze' })}</h3>
          <CreateAgentKeyDialog userName={userName} />
          <p>
            {t({
              en: 'Give each agent its own key. Keys do not expire; revoke one to cut off access.',
              pl: 'Daj każdemu agentowi osobny klucz. Klucze nie wygasają; unieważnij klucz, aby odciąć dostęp.',
            })}
          </p>
        </div>

        <AgentKeyList />
      </section>

      <details className={css.disclosure}>
        <summary>
          <ShieldCheckIcon aria-hidden='true' />
          <span className={css.summaryText}>
            <span>{t({ en: 'What AI can access', pl: 'Do czego AI ma dostęp' })}</span>
            <PermissionSummary />
          </span>
          <ChevronDownIcon aria-hidden='true' className={css.chevron} />
        </summary>
        <AgentPermissions />
      </details>
    </Card>
  );
}

/** Shows how many features are open so the collapsed permissions row still says something useful. */
function PermissionSummary() {
  const { t } = useI18n();
  const permissions = useAgentPermissionsQuery().data;
  if (!permissions) return <small />;
  const reads = agentFeatureNames.filter((feature) => permissions[feature].read).length;
  const writes = agentFeatureNames.filter((feature) => permissions[feature].write).length;
  if (!reads && !writes)
    return <small>{t({ en: 'Nothing shared', pl: 'Nic nie udostępniono' })}</small>;
  const total = agentFeatureNames.length;
  return (
    <small>
      {t({
        en: `${reads}/${total} read · ${writes} write`,
        pl: `odczyt ${reads}/${total} · zapis ${writes}`,
      })}
    </small>
  );
}
