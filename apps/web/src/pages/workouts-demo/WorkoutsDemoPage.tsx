import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useState } from 'react';
import { HintsDemo } from './hints/HintsDemo';
import { InputsDemo } from './inputs/InputsDemo';
import { LibraryDemo } from './library/LibraryDemo';
import type { RestVariant } from './rest/RestTimer';
import { RoutinesDemo } from './routines/RoutinesDemo';
import { SessionDemo } from './session/SessionDemo';
import type { CellMode } from './session/SetRow';
import css from './WorkoutsDemoPage.module.css';

const TABS = {
  session: 'Live session',
  home: 'Workouts',
  inputs: 'Set input',
  library: 'Exercises',
  hints: 'Hints',
} as const;

const REST_VARIANTS: Record<RestVariant, string> = {
  dock: 'A · Dock pill ★',
  bubble: 'B · Corner ring',
  inline: 'C · Inline',
};

const CELL_MODES: Record<CellMode, string> = {
  drag: 'Drag + top sheet ★',
  type: 'Type in cells',
};

type Tab = keyof typeof TABS;

/** Mock playground for #177: every tab is a separate idea to keep or throw away. Nothing saves. */
export function WorkoutsDemoPage() {
  const [tab, setTab] = useState<Tab>('session');
  const [restVariant, setRestVariant] = useState<RestVariant>('dock');
  const [cellMode, setCellMode] = useState<CellMode>('drag');

  return (
    <main className={css.page}>
      <p className={css.intro}>
        Workouts playground (#177). Mock data only. Long press on phone, right click on desktop:
        almost every row has a context menu.
      </p>

      <Segmented label='Demo' onChange={setTab} options={TABS} value={tab} />

      {tab === 'session' ? (
        <>
          <div className={css.restPicker}>
            <span>Set cells</span>
            <Segmented
              label='Set cells'
              onChange={setCellMode}
              options={CELL_MODES}
              small
              value={cellMode}
            />
            <span>Rest timer</span>
            <Segmented
              label='Rest timer style'
              onChange={setRestVariant}
              options={REST_VARIANTS}
              small
              value={restVariant}
            />
          </div>
          <SessionDemo cellMode={cellMode} restVariant={restVariant} />
        </>
      ) : null}
      {tab === 'home' ? <RoutinesDemo /> : null}
      {tab === 'inputs' ? <InputsDemo /> : null}
      {tab === 'library' ? <LibraryDemo /> : null}
      {tab === 'hints' ? <HintsDemo /> : null}
    </main>
  );
}

type SegmentedProps<T extends string> = {
  label: string;
  onChange: (value: T) => void;
  options: Record<T, string>;
  small?: boolean;
  value: T;
};

function Segmented<T extends string>({
  label,
  onChange,
  options,
  small,
  value,
}: SegmentedProps<T>) {
  const keys = Object.keys(options) as T[];
  return (
    <ToggleGroup
      aria-label={label}
      className={small ? css.segmentedSmall : css.segmented}
      onValueChange={(values) => {
        const next = keys.find((key) => key === values[0]);
        if (next) onChange(next);
      }}
      value={[value]}
    >
      {keys.map((key) => (
        <Toggle className={css.segment} key={key} value={key}>
          {options[key]}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
