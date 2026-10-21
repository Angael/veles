import { useRouter } from '@tanstack/react-router';
import { LockKeyholeIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import { Label } from '@/components/ui/label/Label';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import type { DiaryKeyRecord } from './diaryCrypto';
import { useDiaryPassphraseMutation } from './diary.query';
import css from './DiaryPassphraseForm.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type DiaryPassphraseFormProps = {
  keyRecord: DiaryKeyRecord | null;
  onUnlocked: (key: CryptoKey) => void;
};

export function DiaryPassphraseForm({ keyRecord, onUnlocked }: DiaryPassphraseFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const mutation = useDiaryPassphraseMutation(keyRecord);
  const [mismatch, setMismatch] = useState(false);
  const isSetup = keyRecord === null;

  let errorMsg: string | undefined;
  if (mismatch) errorMsg = t({ en: 'Passphrases do not match.', pl: 'Hasła nie są takie same.' });
  else if (mutation.isError) {
    errorMsg = isSetup
      ? t({
          en: 'The passphrase could not be saved. Try again.',
          pl: 'Nie udało się zapisać hasła. Spróbuj ponownie.',
        })
      : t({ en: 'Wrong passphrase.', pl: 'Nieprawidłowe hasło.' });
  }

  return (
    <main className={css.page}>
      <Card as='section' className={css.card} data-appear>
        <LockKeyholeIcon aria-hidden='true' className={css.icon} />
        <h1>
          {isSetup
            ? t({ en: 'Protect your diary', pl: 'Chroń swój dziennik' })
            : t({ en: 'Diary locked', pl: 'Dziennik zablokowany' })}
        </h1>
        <p className={css.text}>
          {isSetup
            ? t({
                en: 'Your entries are encrypted on this device with a passphrase. The server never sees it. If you forget it, nobody can recover your entries.',
                pl: 'Wpisy są szyfrowane na tym urządzeniu hasłem. Serwer nigdy go nie widzi. Jeśli je zapomnisz, nikt nie odzyska Twoich wpisów.',
              })
            : t({
                en: 'Enter your passphrase to read your entries.',
                pl: 'Wpisz hasło, aby przeczytać wpisy.',
              })}
        </p>
        <TypedForm
          className={css.form}
          errorMsg={errorMsg}
          onSubmit={(data) => {
            const passphrase = data.string('passphrase');
            const isMismatch = isSetup && passphrase !== data.string('confirm');
            setMismatch(isMismatch);
            if (isMismatch) return;

            mutation.mutate(
              { passphrase, remember: data.checked('remember') },
              {
                onSuccess: (key) => {
                  onUnlocked(key);
                  if (isSetup) void router.invalidate();
                },
              },
            );
          }}
        >
          <Label text={t({ en: 'Passphrase', pl: 'Hasło' })}>
            <TextInput
              autoComplete={isSetup ? 'new-password' : 'current-password'}
              minLength={isSetup ? 8 : undefined}
              name='passphrase'
              required
              type='password'
            />
          </Label>
          {isSetup ? (
            <Label text={t({ en: 'Repeat passphrase', pl: 'Powtórz hasło' })}>
              <TextInput autoComplete='new-password' name='confirm' required type='password' />
            </Label>
          ) : null}
          <label className={css.remember}>
            <Checkbox name='remember' />
            {t({ en: 'Remember on this device', pl: 'Zapamiętaj na tym urządzeniu' })}
          </label>
          <Btn loading={mutation.isPending} type='submit' variant='main'>
            {isSetup
              ? t({ en: 'Set passphrase', pl: 'Ustaw hasło' })
              : t({ en: 'Unlock', pl: 'Odblokuj' })}
          </Btn>
        </TypedForm>
      </Card>
    </main>
  );
}
