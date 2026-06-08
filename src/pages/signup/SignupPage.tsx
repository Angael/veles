import { Link, useNavigate } from '@tanstack/react-router';
import { AuthCard } from '@/components/auth-card/AuthCard';
import { Label } from '@/components/label/Label';
import { TextInput } from '@/components/text-input/TextInput';
import { signIn, signUp } from '@/lib/auth/client';
import { useAuthAction } from '@/lib/auth/useAuthAction';

export function SignupPendingPage() {
  return (
    <AuthCard
      busy={true}
      description='Loading account creation form.'
      error={null}
      fields={
        <>
          <Label htmlFor='pending-name' text='Name'>
            <TextInput
              autoComplete='name'
              disabled
              id='pending-name'
              placeholder='Ada Lovelace'
              type='text'
            />
          </Label>
          <Label htmlFor='pending-email' text='Email'>
            <TextInput
              autoComplete='email'
              disabled
              id='pending-email'
              placeholder='name@example.com'
              type='email'
            />
          </Label>
          <Label htmlFor='pending-password' text='Password'>
            <TextInput disabled id='pending-password' placeholder='********' type='password' />
          </Label>
        </>
      }
      footer='Already have an account? Log in'
      onSubmit={async () => {}}
      submitLabel='Create account'
      title='Sign up'
    />
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { busy, error, runAuthAction, setError } = useAuthAction();

  return (
    <AuthCard
      busy={busy}
      description='Create a Veles account.'
      error={error}
      fields={
        <>
          <Label htmlFor='name' text='Name'>
            <TextInput
              autoComplete='name'
              id='name'
              name='name'
              placeholder='Ada Lovelace'
              required
              type='text'
            />
          </Label>
          <Label htmlFor='email' text='Email'>
            <TextInput
              autoComplete='email'
              id='email'
              name='email'
              placeholder='name@example.com'
              required
              type='email'
            />
          </Label>
          <Label htmlFor='password' text='Password'>
            <TextInput
              autoComplete='new-password'
              id='password'
              minLength={8}
              name='password'
              placeholder='********'
              required
              type='password'
            />
          </Label>
        </>
      }
      footer={
        <>
          Already have an account? <Link to={'/login'}>Log in</Link>
        </>
      }
      onGoogle={async () => {
        await runAuthAction(async () => {
          await signIn.social({
            provider: 'google',
            callbackURL: '/',
          });
        }, 'Google sign-in failed');
      }}
      onSubmit={async (formData) => {
        await runAuthAction(async () => {
          const result = await signUp.email({
            name: String(formData.get('name') || ''),
            email: String(formData.get('email') || ''),
            password: String(formData.get('password') || ''),
          });

          if (result.error) {
            setError(result.error.message || 'Signup failed');
            return;
          }

          navigate({ to: '/' });
        }, 'Signup failed');
      }}
      submitLabel='Create account'
      title='Sign up'
    />
  );
}
