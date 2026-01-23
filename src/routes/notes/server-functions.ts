import { createServerFn } from '@tanstack/react-start';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { notes } from '@/db/schema';

type NoteInput = {
	content: string;
};

export const getNotes = createServerFn({ method: 'GET' }).handler(async () => {
	const allNotes = await db.select().from(notes).orderBy(desc(notes.createdAt));

	return allNotes;
});

export const saveNote = createServerFn({ method: 'POST' })
	.inputValidator((data: NoteInput) => {
		if (!data.content || typeof data.content !== 'string') {
			throw new Error('Content is required and must be a string');
		}
		return data;
	})
	.handler(async ({ data }: { data: NoteInput }) => {
		const [note] = await db
			.insert(notes)
			.values({ content: data.content })
			.returning();

		return { success: true, note };
	});
