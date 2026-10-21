import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, eq } from 'drizzle-orm';
import { listItems, notes, users } from '@veles/db/schema';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import {
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
import {
  accessibleNote,
  createNoteRecord,
  updateNoteRecord,
  deleteNoteRecord,
  setNoteSharedRecord,
  toggleNoteTypeRecord,
  createListItemRecord,
  updateListItemRecord,
  setListItemCheckedRecord,
  deleteListItemRecord,
} from './notes.server';

/** One shopping list row as synced into the client-side `listItems` collection. */
export type NoteListItem = {
  checked: boolean;
  createdAt: string;
  id: string;
  name: string;
  noteId: string;
};

export type NoteSummary = {
  content: string;
  id: string;
  isOwned: boolean;
  ownerName: string;
  shared: boolean;
  title: string;
  type: 'note' | 'shopping_list';
  version: number;
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
        version: notes.version,
      })
      .from(notes)
      .innerJoin(users, eq(notes.ownerId, users.id))
      .where(accessibleNote(session.user.id))
      .orderBy(asc(notes.createdAt), asc(notes.id));
    return ownedNotes.flatMap((note): NoteSummary[] => {
      if (note.type !== 'note' && note.type !== 'shopping_list') return [];

      return [
        {
          content: note.content,
          id: note.id,
          isOwned: note.ownerId === session.user.id,
          ownerName: note.ownerName,
          shared: note.shared,
          title: note.title,
          type: note.type,
          version: note.version,
        },
      ];
    });
  });

/** Returns every list item the user can access as flat rows; the client collection groups them. */
export const getListItems = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getListItems')])
  .handler(async (): Promise<NoteListItem[]> => {
    const session = await requireSession();
    const rows = await db
      .select({
        checked: listItems.checked,
        createdAt: listItems.createdAt,
        id: listItems.id,
        name: listItems.name,
        noteId: listItems.noteId,
      })
      .from(listItems)
      .innerJoin(notes, eq(notes.id, listItems.noteId))
      .where(and(accessibleNote(session.user.id), eq(notes.type, 'shopping_list')))
      .orderBy(asc(listItems.createdAt), asc(listItems.id));

    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  });

export const createNote = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createNote')])
  .validator(arkTypeValidator(createNoteInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return createNoteRecord(session.user.id, data);
  });

export const updateNote = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateNote')])
  .validator(arkTypeValidator(updateNoteInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return updateNoteRecord(session.user.id, data, true);
  });

export const deleteNote = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteNote')])
  .validator(arkTypeValidator(deleteNoteInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return deleteNoteRecord(session.user.id, data);
  });

export const setNoteShared = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('setNoteShared')])
  .validator(arkTypeValidator(setNoteSharedInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return setNoteSharedRecord(session.user.id, data);
  });

/** Converts the stored lines atomically so a note never exposes mixed formats. */
export const toggleNoteType = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('toggleNoteType')])
  .validator(arkTypeValidator(toggleNoteTypeInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return toggleNoteTypeRecord(session.user.id, data, true);
  });

export const createListItem = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createListItem')])
  .validator(arkTypeValidator(createListItemInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return createListItemRecord(session.user.id, data, true);
  });

export const updateListItem = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateListItem')])
  .validator(arkTypeValidator(updateListItemInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return updateListItemRecord(session.user.id, data, true);
  });

export const setListItemChecked = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('setListItemChecked')])
  .validator(arkTypeValidator(setListItemCheckedInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return setListItemCheckedRecord(session.user.id, data, true);
  });

export const deleteListItem = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteListItem')])
  .validator(arkTypeValidator(deleteListItemInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return deleteListItemRecord(session.user.id, data, true);
  });
