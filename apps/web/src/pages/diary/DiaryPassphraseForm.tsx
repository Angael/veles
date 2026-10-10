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

type DiaryPassphraseFormProps = {
  keyRecord: DiaryKeyRecord | null;
  onUnlocked: (key: CryptoKey) => void;
};

export function DiaryPassphraseForm({ keyRecord, onUnlocked }: DiaryPassphraseFormProps) {
  const router = useRouter();
  const mutation = useDiaryPassphraseMutation(keyRecord);
  const [mismatch, setMismatch] = useState(false);
  const isSetup = keyRecord === null;

  let errorMsg: string | undefined;
  if (mismatch) errorMsg = 'Passphrases do not match.';
  else if (mutation.isError) {
    errorMsg = isSetup ? 'The passphrase could not be saved. Try again.' : 'Wrong passphrase.';
  }

  return (
    <main className={css.page}>
      <Card as='section' className={css.card} data-appear>
        <LockKeyholeIcon aria-hidden='true' className={css.icon} />
        <h1>{isSetup ? 'Protect your diary' : 'Diary locked'}</h1>
        <p className={css.text}>
          {isSetup
            ? 'Your entries are encrypted on this device with a passphrase. The server never sees it. If you forget it, nobody can recover your entries.'
            : 'Enter your passphrase to read your entries.'}
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
          <Label text='Passphrase'>
            <TextInput
              autoComplete={isSetup ? 'new-password' : 'current-password'}
              autoFocus
              minLength={isSetup ? 8 : undefined}
              name='passphrase'
              required
              type='password'
            />
          </Label>
          {isSetup ? (
            <Label text='Repeat passphrase'>
              <TextInput autoComplete='new-password' name='confirm' required type='password' />
            </Label>
          ) : null}
          <label className={css.remember}>
            <Checkbox name='remember' />
            Remember on this device
          </label>
          <Btn loading={mutation.isPending} type='submit' variant='main'>
            {isSetup ? 'Set passphrase' : 'Unlock'}
          </Btn>
        </TypedForm>
      </Card>
    </main>
  );
}
