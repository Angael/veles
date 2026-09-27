import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, eq, inArray, or } from 'drizzle-orm';
import { listItems, notes, userConnections, users } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { invariant } from '@/lib/invariant';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';

export type NoteListItem = {
  checked: boolean;
  id: string;
  name: string;
};

export type NoteSummary = {
  content: string;
  id: string;
  isOwned: boolean;
  ownerName: string;
  shared: boolean;
  items: NoteListItem[];
  title: string;
  type: 'note' | 'shopping_list';
};

export const getNotes = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getNotes')])
  .handler(async () => {
    const session = await requireSession();
    const ownedNotes = await db
      .select({
        content: notes.content,
        id: notes.id,
        ownerId: notes.ownerId,
        ownerName: users.name,
        shared: notes.shared,
        title: notes.title,
        type: notes.type,
      })
      .from(notes)
      .innerJoin(users, eq(notes.ownerId, users.id))
      .where(
        or(
          eq(notes.ownerId, session.user.id),
          and(
            eq(notes.shared, true),
            or(
              inArray(
                notes.ownerId,
                db
                  .select({ id: userConnections.userHighId })
                  .from(userConnections)
                  .where(eq(userConnections.userLowId, session.user.id)),
              ),
              inArray(
                notes.ownerId,
                db
                  .select({ id: userConnections.userLowId })
                  .from(userConnections)
                  .where(eq(userConnections.userHighId, session.user.id)),
              ),
            ),
          ),
        ),
      )
      .orderBy(asc(notes.createdAt), asc(notes.id));
    const shoppingListIds = ownedNotes
      .filter((note) => note.type === 'shopping_list')
      .map((note) => note.id);
    const items =
      shoppingListIds.length === 0
        ? []
        : await db
            .select({
              checked: listItems.checked,
              id: listItems.id,
              name: listItems.name,
              noteId: listItems.noteId,
            })
            .from(listItems)
            .where(inArray(listItems.noteId, shoppingListIds))
            .orderBy(asc(listItems.createdAt), asc(listItems.id));

    return ownedNotes.flatMap((note): NoteSummary[] => {
      if (note.type !== 'note' && note.type !== 'shopping_list') return [];

      return [
        {
          content: note.content,
          id: note.id,
          isOwned: note.ownerId === session.user.id,
          items: items.filter((item) => item.noteId === note.id),
          ownerName: note.ownerName,
          shared: note.shared,
          title: note.title,
          type: note.type,
        },
      ];
    });
  });

const createNoteInputType = type({
  content: 'string <= 16000',
  title: 'string.trim |> 0 < string <= 160',
  type: "'note' | 'shopping_list'",
});

export const createNote = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createNote')])
  .validator(arkTypeValidator(createNoteInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [created] = await db
      .insert(notes)
      .values({
        content: data.content,
        ownerId: session.user.id,
        title: data.title,
        type: data.type,
      })
      .returning({ id: notes.id });

    invariant(created, 'Note could not be created.');
    return created;
  });

const updateNoteInputType = type({
  id: 'string.uuid',
  'title?': 'string.trim |> 0 < string <= 160',
  'content?': 'string <= 16000',
});

export const updateNote = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateNote')])
  .validator(arkTypeValidator(updateNoteInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [updated] = await db
      .update(notes)
      .set({ title: data.title, content: data.content, updatedAt: new Date() })
      .where(and(eq(notes.id, data.id), eq(notes.ownerId, session.user.id)))
      .returning({ id: notes.id });

    if (!updated) throw new ClientSafeError('Note not found.');
  });

const deleteNoteInputType = type({ id: 'string.uuid' });

export const deleteNote = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteNote')])
  .validator(arkTypeValidator(deleteNoteInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [deleted] = await db
      .delete(notes)
      .where(and(eq(notes.id, data.id), eq(notes.ownerId, session.user.id)))
      .returning({ id: notes.id });

    if (!deleted) throw new ClientSafeError('Note not found.');
  });

const setNoteSharedInputType = type({ id: 'string.uuid', shared: 'boolean' });

export const setNoteShared = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('setNoteShared')])
  .validator(arkTypeValidator(setNoteSharedInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [updated] = await db
      .update(notes)
      .set({ shared: data.shared, updatedAt: new Date() })
      .where(and(eq(notes.id, data.id), eq(notes.ownerId, session.user.id)))
      .returning({ id: notes.id });

    if (!updated) throw new ClientSafeError('Note not found.');
  });

const toggleNoteTypeInputType = type({ id: 'string.uuid' });

/** Converts the stored lines atomically so a note never exposes mixed formats. */
export const toggleNoteType = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('toggleNoteType')])
  .validator(arkTypeValidator(toggleNoteTypeInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await db.transaction(async (tx) => {
      const [note] = await tx
        .select({ content: notes.content, type: notes.type })
        .from(notes)
        .where(and(eq(notes.id, data.id), eq(notes.ownerId, session.user.id)))
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
  });

const createListItemInputType = type({
  name: 'string.trim |> 0 < string <= 240',
  noteId: 'string.uuid',
});

export const createListItem = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createListItem')])
  .validator(arkTypeValidator(createListItemInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [shoppingList] = await db
      .select({ id: notes.id })
      .from(notes)
      .where(
        and(
          eq(notes.id, data.noteId),
          eq(notes.ownerId, session.user.id),
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
  });

const updateListItemInputType = type({
  id: 'string.uuid',
  name: 'string.trim |> 0 < string <= 240',
});

export const updateListItem = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateListItem')])
  .validator(arkTypeValidator(updateListItemInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [item] = await db
      .select({ id: listItems.id, noteId: listItems.noteId })
      .from(listItems)
      .innerJoin(notes, eq(notes.id, listItems.noteId))
      .where(and(eq(listItems.id, data.id), eq(notes.ownerId, session.user.id)))
      .limit(1);

    if (!item) throw new ClientSafeError('Product not found.');

    await db.update(listItems).set({ name: data.name }).where(eq(listItems.id, item.id));
    await db.update(notes).set({ updatedAt: new Date() }).where(eq(notes.id, item.noteId));
  });

const setListItemCheckedInputType = type({
  checked: 'boolean',
  id: 'string.uuid',
});

export const setListItemChecked = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('setListItemChecked')])
  .validator(arkTypeValidator(setListItemCheckedInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [item] = await db
      .select({ id: listItems.id })
      .from(listItems)
      .innerJoin(notes, eq(notes.id, listItems.noteId))
      .where(and(eq(listItems.id, data.id), eq(notes.ownerId, session.user.id)))
      .limit(1);

    if (!item) throw new ClientSafeError('Product not found.');

    await db.update(listItems).set({ checked: data.checked }).where(eq(listItems.id, item.id));
  });
