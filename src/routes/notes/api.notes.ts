import { createFileRoute } from '@tanstack/react-router';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { notes } from '@/db/schema';

export const Route = createFileRoute('/notes/api/notes')({
	server: {
		handlers: {
			GET: async () => {
				const allNotes = await db
					.select()
					.from(notes)
					.orderBy(desc(notes.createdAt));

				return Response.json(allNotes);
			},
		},
	},
});
