import { createFileRoute } from '@tanstack/react-router';
import { PlusIcon, SearchIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { AppFrame } from '@/components/app-frame/AppFrame';
import { AuthCard } from '@/components/auth-card/AuthCard';
import { Btn, type BtnSize, type BtnVariant } from '@/components/btn/Btn';
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

const BTN_VARIANTS = [
  { label: 'Main', value: 'main' },
  { label: 'Danger', value: 'danger' },
  { label: 'Outline main', value: 'outlineMain' },
  { label: 'Outline danger', value: 'outlineDanger' },
  { label: 'White', value: 'white' },
  { label: 'Ghost', value: 'ghost' },
  { label: 'Ghost danger', value: 'ghostDanger' },
] satisfies DemoProp<BtnVariant>[];

const BTN_SIZES = [
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
] satisfies DemoProp<BtnSize>[];

type DemoProp<T extends string> = {
  label: string;
  value: T;
};

export const Route = createFileRoute('/demo/components')({
  component: ComponentsDemoPage,
  head: () => ({ meta: [{ title: 'Components Demo' }] }),
});

function ComponentsDemoPage() {
  const [textValue, setTextValue] = useState('Smoky bowl');
  const [numberValue, setNumberValue] = useState<number | null>(320);
  const [selectValue, setSelectValue] = useState<(typeof SELECT_OPTIONS)[number]['value']>('lte');
  const [btnLoading, setBtnLoading] = useState(false);

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

      <section>
        <h2>Btn</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <input
            checked={btnLoading}
            onChange={(event) => setBtnLoading(event.target.checked)}
            type='checkbox'
          />
          Show loaders on buttons
        </label>
        <DemoTable
          columns={BTN_SIZES}
          renderCell={({ column, row }) => (
            <Btn
              icon={<PlusIcon aria-hidden='true' size={16} strokeWidth={1.8} />}
              loading={btnLoading}
              size={column.value}
              variant={row.value}
            >
              {row.label}
            </Btn>
          )}
          rows={BTN_VARIANTS}
        />
        <h3>Icon only</h3>
        <DemoTable
          columns={BTN_SIZES}
          renderCell={({ column, row }) => (
            <Btn
              aria-label={`${row.label} ${column.label.toLowerCase()} icon button`}
              icon={<SearchIcon aria-hidden='true' size={16} strokeWidth={1.8} />}
              iconOnly
              loading={btnLoading}
              size={column.value}
              variant={row.value}
            />
          )}
          rows={BTN_VARIANTS}
        />
      </section>

      <section>
        <h2>Card</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          <Card as='article'>Default card</Card>
          <Card as='article' variant='primary'>
            Primary card
          </Card>
          <Card as='article' variant='danger'>
            Danger card
          </Card>
          <Card as='article' shadow={false}>
            Card without shadow
          </Card>
        </div>
      </section>

      <section>
        <h2>ErrorCard</h2>
        <ErrorCard
          message='Network request failed in this demo state.'
          title='Could not fetch data'
        />
      </section>

      <section>
        <h2>TextInput</h2>
        <TextInput
          aria-label='Demo text input'
          onValueChange={setTextValue}
          placeholder='Search recipes'
          type='search'
          value={textValue}
        />
      </section>

      <section>
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

      <section>
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

      <section>
        <h2>AuthCard</h2>
        <AuthCard
          busy={false}
          description='Continue with an invited Google account.'
          error={null}
          onGoogle={async () => {}}
          title='Welcome back'
        />
      </section>

      <section>
        <h2>NavMenu</h2>
        <NavMenu />
      </section>

      <section>
        <h2>AppFrame</h2>
        <AppFrame />
      </section>

      <section>
        <h2>NotFound</h2>
        <Card>
          <NotFound />
        </Card>
      </section>

      <section>
        <h2>DefaultCatchBoundary</h2>
        <Card>
          <DefaultCatchBoundary
            error={new Error('Demo boundary error')}
            info={{ componentStack: '' }}
            reset={() => {}}
          />
        </Card>
      </section>

      <section>
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

function DemoTable<RowValue extends string, ColumnValue extends string>({
  columns,
  renderCell,
  rows,
}: {
  columns: DemoProp<ColumnValue>[];
  renderCell: (props: { column: DemoProp<ColumnValue>; row: DemoProp<RowValue> }) => ReactNode;
  rows: DemoProp<RowValue>[];
}) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--space-xs)',
        overflowX: 'auto',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'grid',
          gap: 'var(--space-xs)',
          gridTemplateColumns: `8rem repeat(${columns.length}, max-content)`,
        }}
      >
        <span aria-hidden='true' />
        {columns.map((column) => (
          <strong key={column.value} style={{ color: 'var(--c-muted-strong)' }}>
            {column.label}
          </strong>
        ))}
        {rows.map((row) => (
          <div key={row.value} style={{ display: 'contents' }}>
            <strong style={{ color: 'var(--c-muted-strong)' }}>{row.label}</strong>
            {columns.map((column) => (
              <div key={column.value}>{renderCell({ column, row })}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
