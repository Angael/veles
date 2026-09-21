import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, inArray, max } from 'drizzle-orm';
import { listItems, notes } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { invariant } from '@/lib/invariant';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';

export type NoteListItem = {
  checked: boolean;
  id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
};

export type NoteSummary = {
  content: string | null;
  id: string;
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
        title: notes.title,
        type: notes.type,
      })
      .from(notes)
      .where(eq(notes.ownerId, session.user.id))
      .orderBy(desc(notes.updatedAt));
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
              quantity: listItems.quantity,
              unit: listItems.unit,
            })
            .from(listItems)
            .where(inArray(listItems.noteId, shoppingListIds))
            .orderBy(asc(listItems.position), asc(listItems.createdAt));

    return ownedNotes.flatMap((note): NoteSummary[] => {
      if (note.type !== 'note' && note.type !== 'shopping_list') return [];

      return [
        {
          ...note,
          type: note.type,
          items: items.filter((item) => item.noteId === note.id),
        },
      ];
    });
  });

const createNoteInputType = type({
  content: 'string.trim |> string <= 16000',
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
        content: data.type === 'note' ? data.content : null,
        ownerId: session.user.id,
        title: data.title,
        type: data.type,
      })
      .returning({ id: notes.id });

    invariant(created, 'Note could not be created.');
    return created;
  });

const createListItemInputType = type({
  name: 'string.trim |> 0 < string <= 240',
  noteId: 'string.uuid',
  quantity: 'string.trim |> string <= 40',
  unit: 'string.trim |> string <= 40',
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

    const [lastItem] = await db
      .select({ position: max(listItems.position) })
      .from(listItems)
      .where(eq(listItems.noteId, shoppingList.id));
    const [created] = await db
      .insert(listItems)
      .values({
        name: data.name,
        noteId: shoppingList.id,
        position: (lastItem?.position ?? -1) + 1,
        quantity: data.quantity || null,
        unit: data.unit || null,
      })
      .returning({ id: listItems.id });

    invariant(created, 'Product could not be added.');
    return created;
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
