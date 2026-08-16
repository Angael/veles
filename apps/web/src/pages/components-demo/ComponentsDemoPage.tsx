// This component catalog may remain intentionally long; keep all component demos together rather than splitting it needlessly.
import { PlusIcon, SearchIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Btn, type BtnSize, type BtnVariant } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { DateInput } from '@/components/date-input/DateInput';
import { DefaultCatchBoundary } from '@/components/default-catch-boundary/DefaultCatchBoundary';
import { ErrorCard } from '@/components/error-card/ErrorCard';
import { FloatingButton } from '@/components/floating-button/FloatingButton';
import { Label } from '@/components/label/Label';
import { Navbar } from '@/components/navbar/Navbar';
import { NotFound } from '@/components/not-found/NotFound';
import { PillBtn } from '@/components/pill-btn/PillBtn';
import { NumberInput } from '@/components/number-input/NumberInput';
import { SeamlessTextInput } from '@/components/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/seamless-textarea/SeamlessTextarea';
import { SelectInput } from '@/components/select-input/SelectInput';
import { Skeleton } from '@/components/skeleton/Skeleton';
import { SliderInput } from '@/components/slider-input/SliderInput';
import { TextInput } from '@/components/text-input/TextInput';
import { TextareaInput } from '@/components/textarea-input/TextareaInput';
import { toastManager } from '@/components/toast/toastManager';
import { UploadTileGrid } from '@/components/upload-tile-grid/UploadTileGrid';
import css from './ComponentsDemoPage.module.css';

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
  { label: 'Text', value: 'text' },
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

/** Renders the historical interactive catalog of the app's shared components. */
export function ComponentsDemoPage() {
  const [textValue, setTextValue] = useState('Smoky bowl');
  const [numberValue, setNumberValue] = useState<number | null>(320);
  const [selectValue, setSelectValue] = useState<(typeof SELECT_OPTIONS)[number]['value']>('lte');
  const [btnLoading, setBtnLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [sliderValue, setSliderValue] = useState(50);

  return (
    <main className={css.page}>
      <h1>Components</h1>

      <section>
        <h2>Btn</h2>
        <label className={css.loaderToggle}>
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
        <h2>PillBtn</h2>
        <PillBtn
          label='Add recipe'
          to='/recipes/new'
          visual={<PlusIcon size={16} strokeWidth={1.8} />}
        />
      </section>

      <section>
        <h2>Card</h2>
        <div className={css.cardRow}>
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
        <h2>Navbar</h2>
        <Navbar user={null} />
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
        <p>This component stays fixed to the viewport and is rendered once for this demo.</p>
      </section>

      <section>
        <h2>Labels and inputs</h2>
        <div className={css.formGrid}>
          <Label text='DateInput'>
            <DateInput defaultValue='2026-08-08' />
          </Label>
          <Label text='TextareaInput'>
            <TextareaInput defaultValue='A standard multiline field.' rows={3} />
          </Label>
        </div>
      </section>

      <section>
        <h2>Seamless fields</h2>
        <Card className={css.seamlessCard}>
          <SeamlessTextInput aria-label='Demo seamless title' defaultValue='Editable card title' />
          <SeamlessTextarea
            aria-label='Demo seamless description'
            defaultValue='These controls inherit the surrounding surface instead of drawing their own.'
            rows={3}
          />
        </Card>
      </section>

      <section>
        <h2>Skeleton</h2>
        <Card className={css.skeletonCard}>
          <Skeleton className={css.skeletonTitle} />
          <Skeleton className={css.skeletonLine} />
          <Skeleton className={css.skeletonShortLine} />
        </Card>
      </section>

      <section>
        <h2>SliderInput</h2>
        <SliderInput
          label='Demo percentage'
          max={100}
          min={0}
          onValueChange={setSliderValue}
          value={sliderValue}
        />
      </section>

      <section>
        <h2>Toast</h2>
        <Btn
          onClick={() =>
            toastManager.add({
              description: 'The global provider renders this notification.',
              title: 'Demo toast',
              type: 'success',
            })
          }
          type='button'
          variant='outlineMain'
        >
          Show toast
        </Btn>
      </section>

      <section>
        <h2>UploadTileGrid</h2>
        <UploadTileGrid
          files={files}
          maxItemSize={5 * 1024 * 1024}
          maxItems={4}
          onFilesChange={setFiles}
        />
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
    <div className={css.tableScroller}>
      <div
        className={css.table}
        style={{ gridTemplateColumns: `8rem repeat(${columns.length}, max-content)` }}
      >
        <span aria-hidden='true' />
        {columns.map((column) => (
          <strong key={column.value}>{column.label}</strong>
        ))}
        {rows.map((row) => (
          <div className={css.tableRow} key={row.value}>
            <strong>{row.label}</strong>
            {columns.map((column) => (
              <div key={column.value}>{renderCell({ column, row })}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
