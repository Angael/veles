import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { appendNoteLinesRecord } from '@/pages/todos/notes.server';
import { saveNoteRecord } from '@/pages/todos/saveNote.server';
import { logRecipeRecord } from './recipeLog.server';
import { addRecipeToNoteInputType, logRecipeInputType } from './recipes.validation';

export const logRecipe = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('logRecipe')])
  .validator(arkTypeValidator(logRecipeInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return logRecipeRecord(session.user.id, data);
  });

/** Adds the recipe's lines to the chosen note, or creates a new shopping list holding them. */
export const addRecipeToNote = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('addRecipeToNote')])
  .validator(arkTypeValidator(addRecipeToNoteInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    if (data.noteId) {
      await appendNoteLinesRecord(session.user.id, data.noteId, data.items);
      return { id: data.noteId };
    }
    return saveNoteRecord(session.user.id, {
      title: data.title,
      type: 'shopping_list',
      items: { add: data.items },
    });
  });
