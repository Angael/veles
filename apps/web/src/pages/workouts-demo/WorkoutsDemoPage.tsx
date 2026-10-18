import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useState } from 'react';
import { LibraryDemo } from './library/LibraryDemo';
import { RoutinesDemo } from './routines/RoutinesDemo';
import { SessionDemo } from './session/SessionDemo';
import css from './WorkoutsDemoPage.module.css';

const TABS = {
  session: 'Live session',
  home: 'Workouts',
  library: 'Exercises',
} as const;

type Tab = keyof typeof TABS;

/** Mock playground for #177: every tab is a separate idea to keep or throw away. Nothing saves. */
export function WorkoutsDemoPage() {
  const [tab, setTab] = useState<Tab>('session');

  return (
    <main className={css.page}>
      <p className={css.intro}>
        Workouts playground (#177). Mock data only. Long press on phone, right click on desktop:
        almost every row has a context menu.
      </p>

      <Segmented label='Demo' onChange={setTab} options={TABS} value={tab} />

      {tab === 'session' ? <SessionDemo /> : null}
      {tab === 'home' ? <RoutinesDemo /> : null}
      {tab === 'library' ? <LibraryDemo /> : null}
    </main>
  );
}

type SegmentedProps<T extends string> = {
  label: string;
  onChange: (value: T) => void;
  options: Record<T, string>;
  value: T;
};

function Segmented<T extends string>({ label, onChange, options, value }: SegmentedProps<T>) {
  const keys = Object.keys(options) as T[];
  return (
    <ToggleGroup
      aria-label={label}
      className={css.segmented}
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
