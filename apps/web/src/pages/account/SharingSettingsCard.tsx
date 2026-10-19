import { Card } from '@/components/ui/card/Card';
import { Toggle } from '@/components/ui/toggle/Toggle';
import { useSharingSettingsQuery, useUpdateSharingSettingMutation } from './account.query';
import type { SharingSetting } from './sharing-settings.api';
import css from './AccountPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Localized } from '@/lib/i18n/locale';

const sharingOptions = [
  {
    description: {
      en: 'Calorie diary and nutrition totals',
      pl: 'Dziennik kalorii i podsumowania wartości odżywczych',
    },
    key: 'calories',
    label: { en: 'Share calories', pl: 'Udostępniaj kalorie' },
    valueKey: 'shareCalories',
  },
  {
    description: { en: 'Weight history and progress', pl: 'Historia wagi i postępy' },
    key: 'weight',
    label: { en: 'Share weight', pl: 'Udostępniaj wagę' },
    valueKey: 'shareWeight',
  },
  {
    description: {
      en: 'Saved recipes and their nutrition',
      pl: 'Zapisane przepisy i ich wartości odżywcze',
    },
    key: 'recipes',
    label: { en: 'Share recipes', pl: 'Udostępniaj przepisy' },
    valueKey: 'shareRecipes',
  },
] as const satisfies ReadonlyArray<{
  description: Localized;
  key: SharingSetting;
  label: Localized;
  valueKey: 'shareCalories' | 'shareRecipes' | 'shareWeight';
}>;

export function SharingSettingsCard() {
  const { t } = useI18n();
  const settingsQuery = useSharingSettingsQuery();
  const updateSettingMutation = useUpdateSharingSettingMutation();

  return (
    <Card aria-busy={settingsQuery.isPending} as='section' data-appear='1'>
      <header className={css.sectionHeader}>
        <div>
          <h2>{t({ en: 'Sharing', pl: 'Udostępnianie' })}</h2>
          <p>
            {t({
              en: 'Choose what will be visible to all your friends.',
              pl: 'Wybierz, co zobaczą wszyscy Twoi znajomi.',
            })}
          </p>
        </div>
      </header>
      <div className={css.sharingSettings}>
        {sharingOptions.map((option) => (
          <label className={css.sharingSetting} key={option.key}>
            <span>
              <strong>{t(option.label)}</strong>
              <small>{t(option.description)}</small>
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
