import { createFileRoute } from '@tanstack/react-router';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { AppFrame } from '@/components/app-frame/AppFrame';
import { AuthCard } from '@/components/auth-card/AuthCard';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { DefaultCatchBoundary } from '@/components/default-catch-boundary/DefaultCatchBoundary';
import { ErrorCard } from '@/components/error-card/ErrorCard';
import { FloatingButton } from '@/components/floating-button/FloatingButton';
import { NavMenu } from '@/components/nav-menu/NavMenu';
import { NotFound } from '@/components/not-found/NotFound';
import { NumberInput } from '@/components/number-input/NumberInput';
import { SelectInput } from '@/components/select-input/SelectInput';
import { TextInput } from '@/components/text-input/TextInput';

const SELECT_OPTIONS = [
  { label: 'Less than or equal', value: 'lte' },
  { label: 'More than or equal', value: 'gte' },
] as const;

export const Route = createFileRoute('/demo/components')({
  component: ComponentsDemoPage,
  head: () => ({ meta: [{ title: 'Components Demo' }] }),
});

function ComponentsDemoPage() {
  const [textValue, setTextValue] = useState('Smoky bowl');
  const [numberValue, setNumberValue] = useState<number | null>(320);
  const [selectValue, setSelectValue] = useState<(typeof SELECT_OPTIONS)[number]['value']>('lte');

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 'var(--space-md)',
      }}
    >
      <h1>Components</h1>

      <section style={{ width: 'min(42rem, 100%)' }}>
        <h2>Btn</h2>
        <Btn icon={<PlusIcon aria-hidden='true' size={16} strokeWidth={1.8} />} variant='primary'>
          Primary action
        </Btn>
      </section>

      <section style={{ width: 'min(42rem, 100%)' }}>
        <h2>Card</h2>
        <Card as='article'>Simple card content</Card>
      </section>

      <section style={{ width: 'min(42rem, 100%)' }}>
        <h2>ErrorCard</h2>
        <ErrorCard
          message='Network request failed in this demo state.'
          title='Could not fetch data'
        />
      </section>

      <section style={{ width: 'min(42rem, 100%)' }}>
        <h2>TextInput</h2>
        <TextInput
          aria-label='Demo text input'
          onValueChange={setTextValue}
          placeholder='Search recipes'
          type='search'
          value={textValue}
        />
      </section>

      <section style={{ width: 'min(42rem, 100%)' }}>
        <h2>NumberInput</h2>
        <NumberInput
          aria-label='Demo number input'
          max={500}
          min={0}
          onValueChange={setNumberValue}
          placeholder='Calories'
          step={10}
          value={numberValue}
        />
      </section>

      <section style={{ width: 'min(42rem, 100%)' }}>
        <h2>SelectInput</h2>
        <SelectInput
          aria-label='Demo select input'
          items={SELECT_OPTIONS}
          onValueChange={(value) => {
            if (value !== null) {
              setSelectValue(value);
            }
          }}
          value={selectValue}
        />
      </section>

      <section style={{ width: 'min(42rem, 100%)' }}>
        <h2>AuthCard</h2>
        <AuthCard
          busy={false}
          description='Simple demo state for the reusable auth shell.'
          error={null}
          fields={
            <>
              <TextInput
                aria-label='Email'
                defaultValue='cook@example.com'
                name='email'
                type='email'
              />
              <TextInput
                aria-label='Password'
                defaultValue='hunter2'
                name='password'
                type='password'
              />
            </>
          }
          footer='Footer copy'
          onGoogle={async () => {}}
          onSubmit={async () => {}}
          submitLabel='Continue'
          title='Welcome back'
        />
      </section>

      <section style={{ width: 'min(42rem, 100%)' }}>
        <h2>NavMenu</h2>
        <NavMenu />
      </section>

      <section style={{ width: 'min(42rem, 100%)' }}>
        <h2>AppFrame</h2>
        <AppFrame />
      </section>

      <section style={{ width: 'min(42rem, 100%)' }}>
        <h2>NotFound</h2>
        <Card>
          <NotFound />
        </Card>
      </section>

      <section style={{ width: 'min(42rem, 100%)' }}>
        <h2>DefaultCatchBoundary</h2>
        <Card>
          <DefaultCatchBoundary
            error={new Error('Demo boundary error')}
            info={{ componentStack: '' }}
            reset={() => {}}
          />
        </Card>
      </section>

      <section style={{ width: 'min(42rem, 100%)' }}>
        <h2>FloatingButton</h2>
        <p>
          This one stays fixed to the viewport, so it is rendered once here rather than inside a
          card.
        </p>
      </section>

      <FloatingButton
        icon={<SearchIcon aria-hidden='true' size={18} strokeWidth={1.8} />}
        to='/demo/components'
      >
        Floating action
      </FloatingButton>
    </main>
  );
}
