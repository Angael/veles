import {
  ArchiveIcon,
  ChartLineIcon,
  CheckIcon,
  MergeIcon,
  PencilIcon,
  RulerIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card/Card';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuSubmenuRoot,
  ContextMenuSubmenuTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { List, ListItem } from '@/components/ui/list/List';
import { toastManager } from '@/components/ui/toast/toastManager';
import { MEASURE_LABELS, type Measure } from '../../workouts/metrics';
import { MOCK_EXERCISES, type MockExercise } from '../mockData';
import { ExercisePicker } from './ExercisePicker';
import css from './Library.module.css';

const mock = (title: string) => toastManager.add({ title: `Mock: ${title}` });

/** The user's own exercise list. "Merge into…" fixes the inevitable "Bench" vs "bench press". */
export function LibraryDemo() {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className={css.layout}>
      <Card as='section' className={css.section}>
        <h2>Picker</h2>
        <p className={css.hint}>
          Fuzzy: try “bnech”, “benchpress”, “latreal” or “pulup”. A new name like “Morning plank”
          guesses what to track.
        </p>
        <ExercisePicker
          onPick={(exercise) => setPicked(`${exercise.name} (${MEASURE_LABELS[exercise.measure]})`)}
        />
        {picked ? <p className={css.hint}>Picked: {picked}</p> : null}
      </Card>

      <Card as='section' className={css.section}>
        <h2>My exercises</h2>
        <p className={css.hint}>Long press or right click a row.</p>
        <List>
          {MOCK_EXERCISES.map((exercise) => (
            <ExerciseRow exercise={exercise} key={exercise.id} />
          ))}
        </List>
      </Card>
    </div>
  );
}

function ExerciseRow({ exercise }: { exercise: MockExercise }) {
  return (
    <ContextMenuRoot>
      <ContextMenuTrigger render={<ListItem className={css.libraryRow} interactive />}>
        <span className={css.resultName}>{exercise.name}</span>
        <span className={css.resultMeta}>
          {MEASURE_LABELS[exercise.measure]} · {exercise.uses}× · best {exercise.lastBest}
        </span>
      </ContextMenuTrigger>
      <ContextMenuPopup aria-label={`${exercise.name} actions`}>
        <ContextMenuItem
          icon={<ChartLineIcon aria-hidden='true' />}
          label='Progress chart'
          onClick={() => mock('progress chart')}
        />
        <ContextMenuItem
          icon={<PencilIcon aria-hidden='true' />}
          label='Rename'
          onClick={() => mock('rename, history keeps the link')}
        />
        <ContextMenuSubmenuRoot>
          <ContextMenuSubmenuTrigger icon={<RulerIcon aria-hidden='true' />} label='Track' />
          <ContextMenuPopup aria-label='What to track'>
            {(Object.keys(MEASURE_LABELS) as Measure[]).map((measure) => (
              <ContextMenuItem
                icon={measure === exercise.measure ? <CheckIcon aria-hidden='true' /> : <span />}
                key={measure}
                label={MEASURE_LABELS[measure]}
                onClick={() => mock(`track ${MEASURE_LABELS[measure]}`)}
              />
            ))}
          </ContextMenuPopup>
        </ContextMenuSubmenuRoot>
        <ContextMenuSubmenuRoot>
          <ContextMenuSubmenuTrigger icon={<MergeIcon aria-hidden='true' />} label='Merge into…' />
          <ContextMenuPopup aria-label='Merge into'>
            {MOCK_EXERCISES.filter((other) => other.id !== exercise.id).map((other) => (
              <ContextMenuItem
                icon={<span />}
                key={other.id}
                label={other.name}
                onClick={() => mock(`merged ${exercise.uses} sessions into "${other.name}"`)}
              />
            ))}
          </ContextMenuPopup>
        </ContextMenuSubmenuRoot>
        <ContextMenuSeparator />
        <ContextMenuItem
          icon={<ArchiveIcon aria-hidden='true' />}
          label='Archive'
          onClick={() => mock('archived, still visible in history')}
          variant='danger'
        />
      </ContextMenuPopup>
    </ContextMenuRoot>
  );
}
