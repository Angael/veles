// Mock data for the workouts playground. Shapes mirror the draft `workouts.schema.ts`.

export type Measure = 'weight_reps' | 'reps' | 'duration' | 'weight_duration' | 'distance_duration';
export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export type MockSet = {
  id: string;
  type: SetType;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceKm: number | null;
  done: boolean;
  /** Same position last time, shown as the ghost value. */
  previous: Omit<MockSet, 'id' | 'done' | 'previous' | 'type'> | null;
};

export type MockSlot = {
  id: string;
  name: string;
  measure: Measure;
  restSeconds: number | null;
  supersetGroup: number | null;
  note: string;
  /** Weight change per fine drag step and ± tap; 1 for dumbbells, 2.5 for most barbells. */
  weightStep: number;
  sets: MockSet[];
};

export type MockExercise = {
  id: string;
  name: string;
  measure: Measure;
  lastDone: string;
  lastBest: string;
  uses: number;
};

export const MEASURE_LABELS: Record<Measure, string> = {
  distance_duration: 'Distance + time',
  duration: 'Time',
  reps: 'Reps',
  weight_duration: 'Weight + time',
  weight_reps: 'Weight × reps',
};

export const SET_TYPE_LABELS: Record<SetType, string> = {
  drop: 'Drop set',
  failure: 'To failure',
  normal: 'Normal',
  warmup: 'Warm-up',
};

let idCounter = 0;
export const mockId = () => `mock-${++idCounter}`;

const emptyMetrics = { distanceKm: null, durationSeconds: null, reps: null, weightKg: null };

export function makeSet(values: Partial<MockSet> = {}): MockSet {
  return { ...emptyMetrics, done: false, id: mockId(), previous: null, type: 'normal', ...values };
}

const lifted = (weightKg: number, reps: number, type: SetType = 'normal') =>
  makeSet({ previous: { ...emptyMetrics, reps, weightKg }, type });

export const initialSession = (): MockSlot[] => [
  {
    id: mockId(),
    measure: 'weight_reps',
    name: 'Bench (the flat one)',
    note: '',
    restSeconds: 120,
    sets: [lifted(40, 10, 'warmup'), lifted(80, 5), lifted(80, 5), lifted(80, 4)],
    supersetGroup: null,
    weightStep: 2.5,
  },
  {
    id: mockId(),
    measure: 'weight_reps',
    name: 'Lateral raise, pink dumbbells',
    note: '',
    restSeconds: 60,
    sets: [lifted(6, 15), lifted(7, 12), lifted(8, 10), lifted(9, 8)],
    supersetGroup: null,
    weightStep: 1,
  },
  {
    id: mockId(),
    measure: 'weight_reps',
    name: 'Cable row, the blue handle',
    note: '',
    restSeconds: 90,
    sets: [lifted(55, 10), lifted(55, 10), lifted(55, 9)],
    supersetGroup: 1,
    weightStep: 2.5,
  },
  {
    id: mockId(),
    measure: 'reps',
    name: 'Dips',
    note: '',
    restSeconds: 90,
    sets: [
      makeSet({ previous: { ...emptyMetrics, reps: 12 } }),
      makeSet({ previous: { ...emptyMetrics, reps: 10 } }),
    ],
    supersetGroup: 1,
    weightStep: 2.5,
  },
  {
    id: mockId(),
    measure: 'duration',
    name: 'Plank but sad',
    note: '',
    restSeconds: 60,
    sets: [makeSet({ previous: { ...emptyMetrics, durationSeconds: 60 } })],
    supersetGroup: null,
    weightStep: 2.5,
  },
];

export const MOCK_EXERCISES: MockExercise[] = [
  {
    id: 'e1',
    lastBest: '80 × 5',
    lastDone: '3 days ago',
    measure: 'weight_reps',
    name: 'Bench (the flat one)',
    uses: 41,
  },
  {
    id: 'e2',
    lastBest: '55 × 10',
    lastDone: '3 days ago',
    measure: 'weight_reps',
    name: 'Cable row, the blue handle',
    uses: 38,
  },
  { id: 'e3', lastBest: '× 12', lastDone: '3 days ago', measure: 'reps', name: 'Dips', uses: 22 },
  {
    id: 'e4',
    lastBest: '1:00',
    lastDone: 'last week',
    measure: 'duration',
    name: 'Plank but sad',
    uses: 9,
  },
  {
    id: 'e5',
    lastBest: '120 × 3',
    lastDone: '5 days ago',
    measure: 'weight_reps',
    name: 'Squat',
    uses: 30,
  },
  {
    id: 'e6',
    lastBest: '5.2 km · 28:10',
    lastDone: '2 days ago',
    measure: 'distance_duration',
    name: 'Park loop run',
    uses: 14,
  },
  {
    id: 'e7',
    lastBest: '-20 × 8',
    lastDone: '2 weeks ago',
    measure: 'weight_reps',
    name: 'Assisted pull-up machine',
    uses: 6,
  },
  {
    id: 'e8',
    lastBest: '24 kg · 0:45',
    lastDone: 'last month',
    measure: 'weight_duration',
    name: 'Farmer walk w/ kettlebells',
    uses: 4,
  },
  {
    id: 'e9',
    lastBest: '80 × 5',
    lastDone: 'last year',
    measure: 'weight_reps',
    name: 'bench press',
    uses: 2,
  },
];

export type MockRoutine = {
  id: string;
  name: string;
  exercises: string[];
  lastDone: string;
};

export const MOCK_ROUTINES: MockRoutine[] = [
  {
    exercises: ['Bench (the flat one)', 'Cable row, the blue handle', 'Dips', 'Plank but sad'],
    id: 'r1',
    lastDone: '3 days ago',
    name: 'Push-ish Monday',
  },
  {
    exercises: ['Squat', 'Assisted pull-up machine', 'Farmer walk w/ kettlebells'],
    id: 'r2',
    lastDone: '5 days ago',
    name: 'Legs + the thing Tom showed me',
  },
  { exercises: ['Park loop run'], id: 'r3', lastDone: '2 days ago', name: 'Run' },
];

export type MockHistoryEntry = {
  id: string;
  name: string;
  date: string;
  durationMinutes: number;
  sets: number;
  volumeKg: number | null;
  note?: string;
};

export const MOCK_HISTORY: MockHistoryEntry[] = [
  { date: 'Fri 3 Oct', durationMinutes: 34, id: 'h1', name: 'Run', sets: 1, volumeKg: null },
  {
    date: 'Thu 2 Oct',
    durationMinutes: 58,
    id: 'h2',
    name: 'Push-ish Monday',
    sets: 14,
    volumeKg: 4820,
  },
  {
    date: 'Tue 30 Sep',
    durationMinutes: 90,
    id: 'h3',
    name: 'Football with the office',
    note: 'No sets, just time. Knee ok.',
    sets: 0,
    volumeKg: null,
  },
  {
    date: 'Mon 29 Sep',
    durationMinutes: 66,
    id: 'h4',
    name: 'Legs + the thing Tom showed me',
    sets: 12,
    volumeKg: 6110,
  },
];

export function formatDuration(totalSeconds: number) {
  const sign = totalSeconds < 0 ? '-' : '';
  const seconds = Math.abs(Math.round(totalSeconds));
  return `${sign}${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** One past appearance of an exercise, for the history sheet and the note placeholder. */
export type ExerciseHistoryEntry = {
  id: string;
  date: string;
  workoutName: string;
  /** 1-based order in that workout: "it went great because it was first". */
  position: number;
  exerciseCount: number;
  sets: string[];
  note: string;
};

const EXERCISE_HISTORY: Record<string, ExerciseHistoryEntry[]> = {
  'Bench (the flat one)': [
    {
      date: 'Thu 2 Oct',
      exerciseCount: 5,
      id: 'b1',
      note: 'Last set grindy. Try 82.5 next time if sleep was ok.',
      position: 1,
      sets: ['W 40×10', '80×5', '80×5', '80×4'],
      workoutName: 'Push-ish Monday',
    },
    {
      date: 'Mon 22 Sep',
      exerciseCount: 4,
      id: 'b2',
      note: 'Done after squats, felt weak.',
      position: 3,
      sets: ['77.5×5', '77.5×5', '77.5×3'],
      workoutName: 'Legs + the thing Tom showed me',
    },
    {
      date: 'Thu 18 Sep',
      exerciseCount: 4,
      id: 'b3',
      note: '',
      position: 1,
      sets: ['77.5×5', '77.5×5', '77.5×5'],
      workoutName: 'Push-ish Monday',
    },
  ],
  'Cable row, the blue handle': [
    {
      date: 'Thu 2 Oct',
      exerciseCount: 5,
      id: 'c1',
      note: 'Seat on 4, chest pad touching.',
      position: 3,
      sets: ['55×10', '55×10', '55×9'],
      workoutName: 'Push-ish Monday',
    },
  ],
  'Lateral raise, pink dumbbells': [
    {
      date: 'Thu 2 Oct',
      exerciseCount: 5,
      id: 'l1',
      note: 'Pyramid up, 9s were sloppy.',
      position: 2,
      sets: ['6×15', '7×12', '8×10', '9×8'],
      workoutName: 'Push-ish Monday',
    },
  ],
};

export const historyFor = (exerciseName: string) => EXERCISE_HISTORY[exerciseName] ?? [];
