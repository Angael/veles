import { Btn } from '@/components/ui/btn/Btn';
import { Toggle } from '@/components/ui/toggle/Toggle';
import { type AgentFeature, agentFeatureNames, agentFeatures } from '@/lib/agentAccess';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  useAgentPermissionsQuery,
  useSetAllAgentPermissionsMutation,
  useUpdateAgentPermissionMutation,
} from './account.query';
import css from './AgentPermissions.module.css';

/** Account-wide AI consent: one "all" row plus a flat per-feature list; applies to every key live. */
export function AgentPermissions() {
  const { t } = useI18n();
  const permissionsQuery = useAgentPermissionsQuery();
  const updateMutation = useUpdateAgentPermissionMutation();
  const setAllMutation = useSetAllAgentPermissionsMutation();
  const permissions = permissionsQuery.data;
  const disabled = !permissions || updateMutation.isPending || setAllMutation.isPending;
  const allOn = (access: 'read' | 'write', features: AgentFeature[]) =>
    !!permissions && features.every((feature) => permissions[feature][access]);
  const error = permissionsQuery.error ?? updateMutation.error ?? setAllMutation.error;

  return (
    <div aria-busy={permissionsQuery.isPending} className={css.section}>
      <p>
        {t({
          en: 'Read lets AI view data. Write lets AI add, edit, and delete it, and needs read. Changes apply to all your keys right away.',
          pl: 'Odczyt pozwala AI przeglądać dane. Zapis pozwala AI je dodawać, zmieniać i usuwać; wymaga odczytu. Zmiany od razu obejmują wszystkie Twoje klucze.',
        })}
      </p>
      <div
        aria-label={t({ en: 'AI permissions', pl: 'Uprawnienia AI' })}
        className={css.table}
        role='group'
      >
        <div className={css.head}>
          <span />
          <span>{t({ en: 'Read', pl: 'Odczyt' })}</span>
          <span>{t({ en: 'Write', pl: 'Zapis' })}</span>
        </div>
        <div className={css.allRow}>
          <strong>{t({ en: 'Allow all', pl: 'Zezwól na wszystko' })}</strong>
          <Toggle
            aria-label={t({
              en: 'Allow AI to read everything',
              pl: 'Zezwól AI na odczyt wszystkiego',
            })}
            checked={allOn('read', agentFeatureNames)}
            disabled={disabled}
            onCheckedChange={(enabled) => setAllMutation.mutate({ access: 'read', enabled })}
          />
          <Toggle
            aria-label={t({
              en: 'Allow AI to write everything',
              pl: 'Zezwól AI na zapis wszystkiego',
            })}
            checked={allOn('write', agentFeatureNames)}
            disabled={disabled}
            onCheckedChange={(enabled) => setAllMutation.mutate({ access: 'write', enabled })}
          />
        </div>
        {agentFeatureNames.map((feature) => {
          const label = t(agentFeatures[feature].label);
          return (
            <div className={css.row} key={feature}>
              <span>{label}</span>
              <Toggle
                aria-label={t({
                  en: `Allow AI to read ${label}`,
                  pl: `Zezwól AI na odczyt: ${label}`,
                })}
                checked={permissions?.[feature].read ?? false}
                disabled={disabled}
                onCheckedChange={(enabled) =>
                  updateMutation.mutate({ feature, access: 'read', enabled })
                }
              />
              <Toggle
                aria-label={t({
                  en: `Allow AI to write ${label}`,
                  pl: `Zezwól AI na zapis: ${label}`,
                })}
                checked={permissions?.[feature].write ?? false}
                disabled={disabled}
                onCheckedChange={(enabled) =>
                  updateMutation.mutate({ feature, access: 'write', enabled })
                }
              />
            </div>
          );
        })}
      </div>
      {error ? (
        <div className={css.error} role='alert'>
          <p>
            {permissionsQuery.error
              ? t({
                  en: 'Could not load AI permissions:',
                  pl: 'Nie udało się wczytać uprawnień AI:',
                })
              : t({
                  en: 'Could not save AI permissions:',
                  pl: 'Nie udało się zapisać uprawnień AI:',
                })}{' '}
            {error.message}
          </p>
          {permissionsQuery.error ? (
            <Btn onClick={() => void permissionsQuery.refetch()} size='sm' variant='outlineMain'>
              {t({ en: 'Retry', pl: 'Ponów' })}
            </Btn>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
