import { Btn } from '@/components/ui/btn/Btn';
import { Toggle } from '@/components/ui/toggle/Toggle';
import { agentFeatureNames, agentFeatures } from '@/lib/agentAccess';
import { useAgentPermissionsQuery, useUpdateAgentPermissionMutation } from './account.query';
import css from './AgentPermissions.module.css';

export function AgentPermissions() {
  const permissionsQuery = useAgentPermissionsQuery();
  const updateMutation = useUpdateAgentPermissionMutation();
  const disabled = !permissionsQuery.data || permissionsQuery.isError || updateMutation.isPending;

  return (
    <section
      aria-busy={permissionsQuery.isPending || updateMutation.isPending}
      className={css.section}
    >
      <h3>I allow AI to access these parts</h3>
      <p>
        Read lets AI view data. Write lets AI create, edit, and delete data. Each switch applies to
        all your agent keys. Both start off and can be changed independently.
      </p>
      <p>Writes start with notes and shopping lists. Other features will follow.</p>
      <div className={css.features}>
        {agentFeatureNames.map((feature) => {
          const option = agentFeatures[feature];
          return (
            <fieldset className={css.feature} key={feature}>
              <legend>{option.label}</legend>
              <p>{option.description}</p>
              <div className={css.controls}>
                <label>
                  <span>Read</span>
                  <Toggle
                    aria-label={`Allow AI to read ${option.label}`}
                    checked={permissionsQuery.data?.[feature].read ?? false}
                    disabled={disabled}
                    onCheckedChange={(enabled) =>
                      updateMutation.mutate({ feature, access: 'read', enabled })
                    }
                  />
                </label>
                <label>
                  <span>
                    Write
                    {!option.writeAvailable ? <small>Coming soon</small> : null}
                  </span>
                  <Toggle
                    aria-label={`Allow AI to write ${option.label}`}
                    checked={permissionsQuery.data?.[feature].write ?? false}
                    disabled={disabled || !option.writeAvailable}
                    onCheckedChange={(enabled) =>
                      updateMutation.mutate({ feature, access: 'write', enabled })
                    }
                  />
                </label>
              </div>
            </fieldset>
          );
        })}
      </div>
      {permissionsQuery.error ? (
        <div role='alert'>
          <p>Could not load AI permissions: {permissionsQuery.error.message}</p>
          <Btn onClick={() => void permissionsQuery.refetch()} size='sm' variant='outlineMain'>
            Retry
          </Btn>
        </div>
      ) : null}
      {updateMutation.error ? (
        <p role='alert'>Could not save: {updateMutation.error.message}</p>
      ) : null}
      <p aria-live='polite'>
        {updateMutation.isPending ? 'Saving permissions…' : ''}
        {updateMutation.isSuccess ? 'Permissions saved.' : ''}
      </p>
    </section>
  );
}
