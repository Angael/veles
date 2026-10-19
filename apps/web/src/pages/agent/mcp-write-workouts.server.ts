import type { McpServer } from '@modelcontextprotocol/server';
import { updateExerciseRecord } from '@/pages/workouts/exercises/exercises.server';
import {
  deleteRoutineRecord,
  saveRoutineFromWorkoutRecord,
  startRoutineRecord,
  updateRoutineFromWorkoutRecord,
  updateRoutineRecord,
} from '@/pages/workouts/routines/routines.server';
import {
  addWorkoutExerciseRecord,
  addWorkoutSetRecord,
  deleteWorkoutRecord,
  deleteWorkoutSetRecord,
  duplicateWorkoutSetRecord,
  moveWorkoutExerciseRecord,
  removeWorkoutExerciseRecord,
  startWorkoutRecord,
  updateWorkoutExerciseRecord,
  updateWorkoutRecord,
  updateWorkoutSetRecord,
} from '@/pages/workouts/session/session.server';
import {
  addWorkoutExerciseInputType,
  addWorkoutSetInputType,
  moveWorkoutExerciseInputType,
  routineWorkoutIdInputType,
  saveRoutineInputType,
  startRoutineInputType,
  startWorkoutInputType,
  updateExerciseInputType,
  updateRoutineInputType,
  updateWorkoutExerciseInputType,
  updateWorkoutInputType,
  updateWorkoutSetInputType,
  workoutIdType,
} from '@/pages/workouts/workouts.validation';
import { agentInput, agentWriter, writeAnnotations } from './mcp-tools.server';

const additive = writeAnnotations({ destructive: false, idempotent: false });
const edit = writeAnnotations({ destructive: false, idempotent: true });
const removal = writeAnnotations({ destructive: true, idempotent: false });

/**
 * Workout writes, the same steps as the app: start a session, add exercises (each gets empty
 * sets), fill the sets, then finish. Only one session can be open at a time.
 */
export function registerWorkoutTools(server: McpServer, userId: string) {
  const write = agentWriter(userId, 'workouts');

  server.registerTool(
    'start_workout',
    {
      description:
        'Start an empty workout session on a date (YYYY-MM-DD). Fails while another session is open; finish it with update_workout first. Returns { id }.',
      inputSchema: agentInput(startWorkoutInputType),
      annotations: additive,
    },
    write(startWorkoutRecord),
  );
  server.registerTool(
    'start_routine',
    {
      description:
        'Start a workout session on a date from a workout_routines id, with its exercises and one empty set per planned set. Same open-session rule as start_workout. Returns { id }.',
      inputSchema: agentInput(startRoutineInputType),
      annotations: additive,
    },
    write(startRoutineRecord),
  );
  server.registerTool(
    'update_workout',
    {
      description:
        'Rename a workout session, or finish (finished: true) or reopen (false) it. Finishing ticks every set that has values.',
      inputSchema: agentInput(updateWorkoutInputType),
      annotations: edit,
    },
    write(updateWorkoutRecord),
  );
  server.registerTool(
    'delete_workout',
    {
      description: 'Delete a workout session with its exercises and sets.',
      inputSchema: agentInput(workoutIdType),
      annotations: removal,
    },
    write(deleteWorkoutRecord),
  );
  server.registerTool(
    'add_workout_exercise',
    {
      description:
        'Add an exercise to a session: exerciseId from workout_exercises, or newExercise { name, measure } to reuse an exercise with that name or create it. It gets as many empty sets as last time. Returns { id } of the session exercise.',
      inputSchema: agentInput(addWorkoutExerciseInputType),
      annotations: additive,
    },
    write(addWorkoutExerciseRecord),
  );
  server.registerTool(
    'update_workout_exercise',
    {
      description: 'Set the notes of a session exercise (exercises[].id in workout_sessions).',
      inputSchema: agentInput(updateWorkoutExerciseInputType),
      annotations: edit,
    },
    write(updateWorkoutExerciseRecord),
  );
  server.registerTool(
    'move_workout_exercise',
    {
      description: 'Move a session exercise one place up or down in its session.',
      inputSchema: agentInput(moveWorkoutExerciseInputType),
      annotations: additive,
    },
    write(moveWorkoutExerciseRecord),
  );
  server.registerTool(
    'remove_workout_exercise',
    {
      description: 'Remove a session exercise and its sets from the session.',
      inputSchema: agentInput(workoutIdType),
      annotations: removal,
    },
    write(removeWorkoutExerciseRecord),
  );
  server.registerTool(
    'add_workout_set',
    {
      description:
        'Append a set to a session exercise (sessionExerciseId = exercises[].id), copying the last set. Returns { id }.',
      inputSchema: agentInput(addWorkoutSetInputType),
      annotations: additive,
    },
    write(addWorkoutSetRecord),
  );
  server.registerTool(
    'duplicate_workout_set',
    {
      description: 'Insert a copy of a set right below it. Returns { id }.',
      inputSchema: agentInput(workoutIdType),
      annotations: additive,
    },
    write(duplicateWorkoutSetRecord),
  );
  server.registerTool(
    'update_workout_set',
    {
      description:
        'Change only the given fields of a set: type (normal, warmup, drop, failure), weightKg, reps, durationSeconds, distanceKm (null clears), done. The exercise measure says which values apply.',
      inputSchema: agentInput(updateWorkoutSetInputType),
      annotations: edit,
    },
    write(updateWorkoutSetRecord),
  );
  server.registerTool(
    'delete_workout_set',
    {
      description: 'Delete a set.',
      inputSchema: agentInput(workoutIdType),
      annotations: removal,
    },
    write(deleteWorkoutSetRecord),
  );
  server.registerTool(
    'update_exercise',
    {
      description:
        'Rename an exercise or change its measure or restSeconds (null for none); applies to all sessions. Names are unique per account.',
      inputSchema: agentInput(updateExerciseInputType),
      annotations: edit,
    },
    write(updateExerciseRecord),
  );
  server.registerTool(
    'save_routine_from_workout',
    {
      description:
        "Save a session's exercises and set types as a new routine and link the session to it. Returns { id }.",
      inputSchema: agentInput(saveRoutineInputType),
      annotations: additive,
    },
    write(saveRoutineFromWorkoutRecord),
  );
  server.registerTool(
    'update_routine_from_workout',
    {
      description: "Replace the linked routine's exercises with this session's exercises.",
      inputSchema: agentInput(routineWorkoutIdInputType),
      annotations: writeAnnotations({ destructive: true, idempotent: true }),
    },
    write(updateRoutineFromWorkoutRecord),
  );
  server.registerTool(
    'update_routine',
    {
      description: 'Rename a routine or change its description.',
      inputSchema: agentInput(updateRoutineInputType),
      annotations: edit,
    },
    write(updateRoutineRecord),
  );
  server.registerTool(
    'delete_routine',
    {
      description: 'Delete a routine. Sessions started from it stay and lose the link.',
      inputSchema: agentInput(workoutIdType),
      annotations: removal,
    },
    write(deleteRoutineRecord),
  );
}
