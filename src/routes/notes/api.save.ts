import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/db';
import { notes } from '@/db/schema';

export const Route = createFileRoute('/notes/api/save')({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const body = await request.json();
				const { content } = body;

				if (!content || typeof content !== 'string') {
					return Response.json(
						{ error: 'Content is required' },
						{ status: 400 },
					);
				}

				const [note] = await db.insert(notes).values({ content }).returning();

				return Response.json({ success: true, note });
			},
		},
	},
});
