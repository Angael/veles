import type { McpServer } from '@modelcontextprotocol/server';
import { updateExerciseRecord } from '@/pages/workouts/exercises/exercises.server';
import {
  deleteRoutineRecord,
  saveRoutinePlanRecord,
} from '@/pages/workouts/routines/routines.server';
import { saveWorkoutRecord } from '@/pages/workouts/session/saveWorkout.server';
import { deleteWorkoutRecord } from '@/pages/workouts/session/session.server';
import {
  saveRoutinePlanInputType,
  saveWorkoutInputType,
  updateExerciseInputType,
  workoutIdType,
} from '@/pages/workouts/workouts.validation';
import { agentInput, agentWriter, writeAnnotations } from './mcp-tools.server';

const destructive = writeAnnotations({ destructive: true, idempotent: false });
const exerciseRef =
  'Each exercise is exerciseId from workout_exercises (read it first to reuse existing ones), or newExercise { name, measure }, which reuses an exercise with that exact name or creates it.';

/** Workout writes: whole sessions and routines in one call each, not step by step. */
export function registerWorkoutTools(server: McpServer, userId: string) {
  const write = agentWriter(userId, 'workouts');

  server.registerTool(
    'save_workout',
    {
      description: `Create (no id; date required) or update (id) a workout session. Omitted fields stay; exercises, when given, replace all exercises and sets in order. ${exerciseRef} A new session is finished unless finished is false (only one open session at a time); with routineId and no exercises it copies the routine. Returns { id }.`,
      inputSchema: agentInput(saveWorkoutInputType),
      annotations: destructive,
    },
    write(saveWorkoutRecord),
  );
  server.registerTool(
    'save_routine',
    {
      description: `Create (no id; name required) or update (id) a workout routine. Omitted fields stay; exercises, when given, replace the plan. setTypes has one entry per planned set. ${exerciseRef} Returns { id }.`,
      inputSchema: agentInput(saveRoutinePlanInputType),
      annotations: destructive,
    },
    write(saveRoutinePlanRecord),
  );
  server.registerTool(
    'update_exercise',
    {
      description:
        'Rename an exercise or change its measure or restSeconds (null for none); applies to all sessions. Names are unique per account.',
      inputSchema: agentInput(updateExerciseInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: true }),
    },
    write(updateExerciseRecord),
  );
  server.registerTool(
    'delete_workout',
    {
      description: 'Delete a workout session with its exercises and sets.',
      inputSchema: agentInput(workoutIdType),
      annotations: destructive,
    },
    write(deleteWorkoutRecord),
  );
  server.registerTool(
    'delete_routine',
    {
      description: 'Delete a routine. Sessions started from it stay and lose the link.',
      inputSchema: agentInput(workoutIdType),
      annotations: destructive,
    },
    write(deleteRoutineRecord),
  );
}
