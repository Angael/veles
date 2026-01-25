import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { items } from '@/db/schema';

const getItems = createServerFn({ method: 'GET' }).handler(async () => {
	const result = await db
		.select()
		.from(items)
		.orderBy(desc(items.createdAt))
		.limit(100);
	return result;
});

export const Route = createFileRoute('/items')({
	component: ItemsPage,
	loader: () => getItems(),
});

function ItemsPage() {
	const items = Route.useLoaderData();

	return (
		<div className='min-h-screen bg-zinc-950 p-4'>
			<h1 className='text-2xl font-bold mb-4 text-violet-400'>
				Items (top 100)
			</h1>
			<pre className='text-green-400 p-4 rounded overflow-auto max-h-[80vh] text-sm border border-violet-900/20'>
				{JSON.stringify(items, null, 2)}
			</pre>
		</div>
	);
}
