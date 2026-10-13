import { Toggle } from '@/components/ui/toggle/Toggle';
import { useSharingSettingsQuery, useUpdateSharingSettingMutation } from './account.query';
import type { SharingSetting } from './sharing-settings.api';
import css from './AccountPage.module.css';

const sharingOptions = [
  {
    description: 'Calorie diary and nutrition totals',
    key: 'calories',
    label: 'Share calories',
    soon: true,
    valueKey: 'shareCalories',
  },
  {
    description: 'Weight history and progress',
    key: 'weight',
    label: 'Share weight',
    soon: true,
    valueKey: 'shareWeight',
  },
  {
    description: 'Saved recipes and their nutrition',
    key: 'recipes',
    label: 'Share recipes',
    soon: false,
    valueKey: 'shareRecipes',
  },
] as const satisfies ReadonlyArray<{
  description: string;
  key: SharingSetting;
  label: string;
  /** Friends cannot see this data yet, so the switch would do nothing. */
  soon: boolean;
  valueKey: 'shareCalories' | 'shareRecipes' | 'shareWeight';
}>;

/** What every friend can see; categories whose friend views are not built yet show "Soon". */
export function SharingSettings() {
  const settingsQuery = useSharingSettingsQuery();
  const updateSettingMutation = useUpdateSharingSettingMutation();

  return (
    <section
      aria-busy={settingsQuery.isPending}
      aria-labelledby='sharing-title'
      className={css.sharingSection}
    >
      <div>
        <h3 id='sharing-title'>Sharing</h3>
        <p>Choose what will be visible to all your friends.</p>
      </div>
      <div className={css.sharingSettings}>
        {sharingOptions.map((option) => (
          <label
            className={css.sharingSetting}
            data-soon={option.soon || undefined}
            key={option.key}
          >
            <span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
            {option.soon ? (
              <span className={css.soon}>Soon</span>
            ) : (
              <Toggle
                checked={settingsQuery.data?.[option.valueKey] ?? false}
                disabled={settingsQuery.isPending || updateSettingMutation.isPending}
                onCheckedChange={(enabled) => {
                  updateSettingMutation.mutate({ enabled, setting: option.key });
                }}
              />
            )}
          </label>
        ))}
      </div>
    </section>
  );
}
