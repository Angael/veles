import { Card } from '@/components/ui/card/Card';
import { Toggle } from '@/components/ui/toggle/Toggle';
import { useSharingSettingsQuery, useUpdateSharingSettingMutation } from './account.query';
import type { SharingSetting } from './sharing-settings.api';
import css from './AccountPage.module.css';

const sharingOptions = [
  {
    description: 'Calorie diary and nutrition totals',
    key: 'calories',
    label: 'Share calories',
    valueKey: 'shareCalories',
  },
  {
    description: 'Weight history and progress',
    key: 'weight',
    label: 'Share weight',
    valueKey: 'shareWeight',
  },
  {
    description: 'Saved recipes and their nutrition',
    key: 'recipes',
    label: 'Share recipes',
    valueKey: 'shareRecipes',
  },
] as const satisfies ReadonlyArray<{
  description: string;
  key: SharingSetting;
  label: string;
  valueKey: 'shareCalories' | 'shareRecipes' | 'shareWeight';
}>;

export function SharingSettingsCard() {
  const settingsQuery = useSharingSettingsQuery();
  const updateSettingMutation = useUpdateSharingSettingMutation();

  return (
    <Card aria-busy={settingsQuery.isPending} as='section' data-appear='1'>
      <header className={css.sectionHeader}>
        <div>
          <h2>Sharing</h2>
          <p>Choose what will be visible to all your friends.</p>
        </div>
      </header>
      <div className={css.sharingSettings}>
        {sharingOptions.map((option) => (
          <label className={css.sharingSetting} key={option.key}>
            <span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
            <Toggle
              checked={settingsQuery.data?.[option.valueKey] ?? false}
              disabled={settingsQuery.isPending || updateSettingMutation.isPending}
              onCheckedChange={(enabled) => {
                updateSettingMutation.mutate({ enabled, setting: option.key });
              }}
            />
          </label>
        ))}
      </div>
    </Card>
  );
}
