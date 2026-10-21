import { and, eq, inArray } from 'drizzle-orm';
import { listItems, notes } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db, type DbTransaction } from '@/server/db.server';
import { convertNoteType, nextNoteVersion, noteVersionConflict } from './notes.server';
import type { saveNoteInputType } from './notes.validation';

type SaveNoteInput = typeof saveNoteInputType.infer;

/** Adds, edits, and removes items of one shopping list; item ids from other lists are ignored. */
async function changeItems(
  tx: DbTransaction,
  noteId: string,
  items: NonNullable<SaveNoteInput['items']>,
) {
  const inNote = (id: string) => and(eq(listItems.id, id), eq(listItems.noteId, noteId));
  for (const item of items.update ?? []) {
    const values = {
      ...(item.name === undefined ? {} : { name: item.name }),
      ...(item.checked === undefined ? {} : { checked: item.checked }),
    };
    if (Object.keys(values).length) await tx.update(listItems).set(values).where(inNote(item.id));
  }
  if (items.remove?.length) {
    await tx
      .delete(listItems)
      .where(and(inArray(listItems.id, items.remove), eq(listItems.noteId, noteId)));
  }
  if (items.add?.length) {
    await tx.insert(listItems).values(items.add.map((name) => ({ name, noteId })));
  }
}

/**
 * Creates or updates an owned note with its sharing, type, and list items in one transaction, so
 * agents edit a note or shopping list in one call. A type change converts content and items first.
 * Title, content, and type changes need the current `version`; the locked row makes the check atomic.
 */
export async function saveNoteRecord(userId: string, data: SaveNoteInput) {
  return db.transaction(async (tx) => {
    let noteId: string;
    let type: string;
    let version: number;
    if (data.id) {
      const [note] = await tx
        .select({ content: notes.content, type: notes.type, version: notes.version })
        .from(notes)
        .where(and(eq(notes.id, data.id), eq(notes.ownerId, userId)))
        .for('update');
      if (!note) throw new ClientSafeError('Note not found.');
      const changesText =
        data.title !== undefined ||
        data.content !== undefined ||
        (data.type !== undefined && data.type !== note.type);
      if (changesText && data.version === undefined) {
        throw new ClientSafeError(
          'version is required to change title, content, or type. Read the note to get it.',
        );
      }
      if (data.version !== undefined && data.version !== note.version) throw noteVersionConflict();
      noteId = data.id;
      type = note.type;
      if (data.type && data.type !== note.type) {
        await convertNoteType(tx, noteId, note);
        type = data.type;
      }
      const [updated] = await tx
        .update(notes)
        .set({
          ...(data.title === undefined ? {} : { title: data.title }),
          ...(data.content === undefined ? {} : { content: data.content }),
          ...(data.shared === undefined ? {} : { shared: data.shared }),
          ...(changesText ? { version: nextNoteVersion } : {}),
          updatedAt: new Date(),
        })
        .where(eq(notes.id, noteId))
        .returning({ version: notes.version });
      if (!updated) throw new Error('Note update returned no row.');
      version = updated.version;
    } else {
      if (!data.title) throw new ClientSafeError('A new note needs a title.');
      type = data.type ?? 'note';
      const [created] = await tx
        .insert(notes)
        .values({
          content: data.content ?? '',
          ownerId: userId,
          shared: data.shared ?? false,
          title: data.title,
          type,
        })
        .returning({ id: notes.id, version: notes.version });
      if (!created) throw new Error('Note insert returned no row.');
      noteId = created.id;
      version = created.version;
    }

    if (data.items) {
      if (type !== 'shopping_list') throw new ClientSafeError('Only shopping lists have items.');
      await changeItems(tx, noteId, data.items);
    }
    return { id: noteId, version };
  });
}
