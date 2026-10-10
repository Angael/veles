import { Btn } from '@/components/ui/btn/Btn';
import { Toggle } from '@/components/ui/toggle/Toggle';
import { type AgentFeature, agentFeatureNames, agentFeatures } from '@/lib/agentAccess';
import {
  useAgentPermissionsQuery,
  useSetAllAgentPermissionsMutation,
  useUpdateAgentPermissionMutation,
} from './account.query';
import css from './AgentPermissions.module.css';

const writableFeatures = agentFeatureNames.filter(
  (feature) => agentFeatures[feature].writeAvailable,
);

/** Account-wide AI consent: one "all" row plus a flat per-feature list; applies to every key live. */
export function AgentPermissions() {
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
        Read lets AI view data. Write lets AI add, edit, and delete it, and needs read. Changes
        apply to all your keys right away.
      </p>
      <div className={css.table} role='group' aria-label='AI permissions'>
        <div className={css.head}>
          <span />
          <span>Read</span>
          <span>Write</span>
        </div>
        <div className={css.allRow}>
          <strong>Allow all</strong>
          <Toggle
            aria-label='Allow AI to read everything'
            checked={allOn('read', agentFeatureNames)}
            disabled={disabled}
            onCheckedChange={(enabled) => setAllMutation.mutate({ access: 'read', enabled })}
          />
          <Toggle
            aria-label='Allow AI to write everything available'
            checked={allOn('write', writableFeatures)}
            disabled={disabled}
            onCheckedChange={(enabled) => setAllMutation.mutate({ access: 'write', enabled })}
          />
        </div>
        {agentFeatureNames.map((feature) => {
          const option = agentFeatures[feature];
          return (
            <div className={css.row} key={feature}>
              <span>{option.label}</span>
              <Toggle
                aria-label={`Allow AI to read ${option.label}`}
                checked={permissions?.[feature].read ?? false}
                disabled={disabled}
                onCheckedChange={(enabled) =>
                  updateMutation.mutate({ feature, access: 'read', enabled })
                }
              />
              {option.writeAvailable ? (
                <Toggle
                  aria-label={`Allow AI to write ${option.label}`}
                  checked={permissions?.[feature].write ?? false}
                  disabled={disabled}
                  onCheckedChange={(enabled) =>
                    updateMutation.mutate({ feature, access: 'write', enabled })
                  }
                />
              ) : (
                <span className={css.soon}>Soon</span>
              )}
            </div>
          );
        })}
      </div>
      {error ? (
        <div className={css.error} role='alert'>
          <p>Could not save AI permissions: {error.message}</p>
          {permissionsQuery.error ? (
            <Btn onClick={() => void permissionsQuery.refetch()} size='sm' variant='outlineMain'>
              Retry
            </Btn>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
