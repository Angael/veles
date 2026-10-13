import { and, asc, eq, inArray, or } from 'drizzle-orm';
import { listItems, notes, userConnections } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { invariant } from '@/lib/invariant';
import { db } from '@/server/db.server';
import type {
  createNoteInputType,
  updateNoteInputType,
  deleteNoteInputType,
  setNoteSharedInputType,
  toggleNoteTypeInputType,
  createListItemInputType,
  updateListItemInputType,
  setListItemCheckedInputType,
  deleteListItemInputType,
} from './notes.validation';

/** Matches notes the user owns or that a connected user shared; these are readable and editable. */
export function accessibleNote(userId: string, includeShared = true) {
  if (!includeShared) return eq(notes.ownerId, userId);
  return or(
    eq(notes.ownerId, userId),
    and(
      eq(notes.shared, true),
      or(
        inArray(
          notes.ownerId,
          db
            .select({ id: userConnections.userHighId })
            .from(userConnections)
            .where(eq(userConnections.userLowId, userId)),
        ),
        inArray(
          notes.ownerId,
          db
            .select({ id: userConnections.userLowId })
            .from(userConnections)
            .where(eq(userConnections.userHighId, userId)),
        ),
      ),
    ),
  );
}

/** Creates a note for the authenticated owner. */
export async function createNoteRecord(userId: string, data: typeof createNoteInputType.infer) {
  const [created] = await db
    .insert(notes)
    .values({
      content: data.content,
      ownerId: userId,
      title: data.title,
      type: data.type,
    })
    .returning({ id: notes.id });

  invariant(created, 'Note could not be created.');
  return created;
}

/** Edits note content within the caller's scope. */
export async function updateNoteRecord(
  userId: string,
  data: typeof updateNoteInputType.infer,
  includeShared = false,
) {
  const [updated] = await db
    .update(notes)
    .set({ title: data.title, content: data.content, updatedAt: new Date() })
    .where(and(eq(notes.id, data.id), accessibleNote(userId, includeShared)))
    .returning({ id: notes.id });

  if (!updated) throw new ClientSafeError('Note not found.');
}

/** Deletes an owned note and its cascading list items. */
export async function deleteNoteRecord(userId: string, data: typeof deleteNoteInputType.infer) {
  const [deleted] = await db
    .delete(notes)
    .where(and(eq(notes.id, data.id), eq(notes.ownerId, userId)))
    .returning({ id: notes.id });

  if (!deleted) throw new ClientSafeError('Note not found.');
}

/** Changes sharing only for a note the caller owns. */
export async function setNoteSharedRecord(
  userId: string,
  data: typeof setNoteSharedInputType.infer,
) {
  const [updated] = await db
    .update(notes)
    .set({ shared: data.shared, updatedAt: new Date() })
    .where(and(eq(notes.id, data.id), eq(notes.ownerId, userId)))
    .returning({ id: notes.id });

  if (!updated) throw new ClientSafeError('Note not found.');
}

/** Converts a note and its items atomically within the caller's scope. */
export async function toggleNoteTypeRecord(
  userId: string,
  data: typeof toggleNoteTypeInputType.infer,
  includeShared = false,
) {
  await db.transaction(async (tx) => {
    const [note] = await tx
      .select({ content: notes.content, type: notes.type })
      .from(notes)
      .where(and(eq(notes.id, data.id), accessibleNote(userId, includeShared)))
      .for('update');

    if (!note) throw new ClientSafeError('Note not found.');

    if (note.type === 'shopping_list') {
      const items = await tx
        .select({ name: listItems.name })
        .from(listItems)
        .where(eq(listItems.noteId, data.id))
        .orderBy(asc(listItems.createdAt), asc(listItems.id));
      await tx
        .update(notes)
        .set({
          content: items.map((item) => item.name).join('\n'),
          type: 'note',
          updatedAt: new Date(),
        })
        .where(eq(notes.id, data.id));
      await tx.delete(listItems).where(eq(listItems.noteId, data.id));
    } else if (note.type === 'note') {
      const names = note.content
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      await tx
        .update(notes)
        .set({ content: '', type: 'shopping_list', updatedAt: new Date() })
        .where(eq(notes.id, data.id));
      if (names.length) {
        await tx.insert(listItems).values(names.map((name) => ({ name, noteId: data.id })));
      }
    }
  });
}

/** Adds an item only to an accessible shopping list. */
export async function createListItemRecord(
  userId: string,
  data: typeof createListItemInputType.infer,
  includeShared = false,
) {
  const [shoppingList] = await db
    .select({ id: notes.id })
    .from(notes)
    .where(
      and(
        eq(notes.id, data.noteId),
        accessibleNote(userId, includeShared),
        eq(notes.type, 'shopping_list'),
      ),
    )
    .limit(1);

  if (!shoppingList) throw new ClientSafeError('Shopping list not found.');

  const [created] = await db
    .insert(listItems)
    .values({
      name: data.name,
      noteId: shoppingList.id,
    })
    .returning({ id: listItems.id });

  invariant(created, 'Product could not be added.');
  return created;
}

/** Renames an accessible item and refreshes its note timestamp. */
export async function updateListItemRecord(
  userId: string,
  data: typeof updateListItemInputType.infer,
  includeShared = false,
) {
  const [item] = await db
    .select({ id: listItems.id, noteId: listItems.noteId })
    .from(listItems)
    .innerJoin(notes, eq(notes.id, listItems.noteId))
    .where(and(eq(listItems.id, data.id), accessibleNote(userId, includeShared)))
    .limit(1);

  if (!item) throw new ClientSafeError('Product not found.');

  await db.update(listItems).set({ name: data.name }).where(eq(listItems.id, item.id));
  await db.update(notes).set({ updatedAt: new Date() }).where(eq(notes.id, item.noteId));
}

/** Changes an accessible item's checked state. */
export async function setListItemCheckedRecord(
  userId: string,
  data: typeof setListItemCheckedInputType.infer,
  includeShared = false,
) {
  const [item] = await db
    .select({ id: listItems.id })
    .from(listItems)
    .innerJoin(notes, eq(notes.id, listItems.noteId))
    .where(and(eq(listItems.id, data.id), accessibleNote(userId, includeShared)))
    .limit(1);

  if (!item) throw new ClientSafeError('Product not found.');

  await db.update(listItems).set({ checked: data.checked }).where(eq(listItems.id, item.id));
}

/** Removes an accessible item and refreshes its note timestamp. */
export async function deleteListItemRecord(
  userId: string,
  data: typeof deleteListItemInputType.infer,
  includeShared = false,
) {
  const [item] = await db
    .select({ id: listItems.id, noteId: listItems.noteId })
    .from(listItems)
    .innerJoin(notes, eq(notes.id, listItems.noteId))
    .where(and(eq(listItems.id, data.id), accessibleNote(userId, includeShared)))
    .limit(1);

  if (!item) throw new ClientSafeError('Item not found.');

  await db.delete(listItems).where(eq(listItems.id, item.id));
  await db.update(notes).set({ updatedAt: new Date() }).where(eq(notes.id, item.noteId));
}
