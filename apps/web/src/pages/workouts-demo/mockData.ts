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
  },
  {
    id: mockId(),
    measure: 'weight_reps',
    name: 'Cable row, the blue handle',
    note: 'Seat on 4',
    restSeconds: 90,
    sets: [lifted(55, 10), lifted(55, 10), lifted(55, 9)],
    supersetGroup: 1,
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
  },
  {
    id: mockId(),
    measure: 'duration',
    name: 'Plank but sad',
    note: '',
    restSeconds: 60,
    sets: [makeSet({ previous: { ...emptyMetrics, durationSeconds: 60 } })],
    supersetGroup: null,
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
