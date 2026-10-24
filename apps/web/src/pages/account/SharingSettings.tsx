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
    soon: true,
    valueKey: 'shareCalories',
  },
  {
    description: { en: 'Weight history and progress', pl: 'Historia wagi i postępy' },
    key: 'weight',
    label: { en: 'Share weight', pl: 'Udostępniaj wagę' },
    soon: true,
    valueKey: 'shareWeight',
  },
  {
    description: {
      en: 'Saved recipes and their nutrition; friends can edit them too',
      pl: 'Zapisane przepisy i ich wartości odżywcze; znajomi mogą je też edytować',
    },
    key: 'recipes',
    label: { en: 'Share recipes', pl: 'Udostępniaj przepisy' },
    soon: false,
    valueKey: 'shareRecipes',
  },
] as const satisfies ReadonlyArray<{
  description: Localized;
  key: SharingSetting;
  label: Localized;
  /** Friends cannot see this data yet, so the switch would do nothing. */
  soon: boolean;
  valueKey: 'shareCalories' | 'shareRecipes' | 'shareWeight';
}>;

/** What every friend can see; categories whose friend views are not built yet show "Soon". */
export function SharingSettings() {
  const { t } = useI18n();
  const settingsQuery = useSharingSettingsQuery();
  const updateSettingMutation = useUpdateSharingSettingMutation();

  return (
    <section
      aria-busy={settingsQuery.isPending}
      aria-labelledby='sharing-title'
      className={css.sharingSection}
    >
      <div>
        <h3 id='sharing-title'>{t({ en: 'Sharing', pl: 'Udostępnianie' })}</h3>
        <p>
          {t({
            en: 'Choose what will be visible to all your friends.',
            pl: 'Wybierz, co zobaczą wszyscy Twoi znajomi.',
          })}
        </p>
      </div>
      <div className={css.sharingSettings}>
        {sharingOptions.map((option) => (
          <label
            className={css.sharingSetting}
            data-soon={option.soon || undefined}
            key={option.key}
          >
            <span>
              <strong>{t(option.label)}</strong>
              <small>{t(option.description)}</small>
            </span>
            {option.soon ? (
              <span className={css.soon}>{t({ en: 'Soon', pl: 'Wkrótce' })}</span>
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
