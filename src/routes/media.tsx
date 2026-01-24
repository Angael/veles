import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { items, thumbnails } from '@/db/schema';

const getMediaItems = createServerFn({ method: 'GET' }).handler(async () => {
	const result = await db
		.select({
			id: items.id,
			type: items.type,
			private: items.private,
			createdAt: items.createdAt,
			thumbnail: {
				id: thumbnails.id,
				path: thumbnails.path,
				width: thumbnails.width,
				height: thumbnails.height,
				type: thumbnails.type,
			},
		})
		.from(items)
		.leftJoin(thumbnails, eq(items.id, thumbnails.itemId))
		.orderBy(desc(items.createdAt))
		.limit(100);

	// Group thumbnails by item
	const itemsMap = new Map<
		number,
		{
			id: number;
			type: string;
			private: boolean;
			createdAt: Date | null;
			thumbnails: Array<{
				id: number;
				path: string;
				width: number;
				height: number;
				type: string;
			}>;
		}
	>();

	for (const row of result) {
		if (!itemsMap.has(row.id)) {
			itemsMap.set(row.id, {
				id: row.id,
				type: row.type,
				private: row.private,
				createdAt: row.createdAt,
				thumbnails: [],
			});
		}

		if (row.thumbnail.id) {
			itemsMap.get(row.id)?.thumbnails.push(row.thumbnail);
		}
	}

	return Array.from(itemsMap.values());
});

export const Route = createFileRoute('/media')({
	component: MediaPage,
	loader: () => getMediaItems(),
});

function MediaPage() {
	const mediaItems = Route.useLoaderData();

	return (
		<div className='p-6'>
			<h1 className='text-3xl font-bold mb-6'>Media</h1>

			{mediaItems.length === 0 ? (
				<div className='text-gray-500 text-center py-12'>
					No media items found
				</div>
			) : (
				<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
					{mediaItems.map((item) => {
						// Get the smallest available thumbnail
						const thumbnail = item.thumbnails.sort(
							(a, b) => a.width - b.width,
						)[0];

						return (
							<div
								key={item.id}
								className='relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer group'
							>
								{thumbnail ? (
									<img
										src={thumbnail.path}
										alt={`Media item ${item.id}`}
										className='w-full h-full object-cover'
									/>
								) : (
									<div className='w-full h-full flex items-center justify-center text-gray-400'>
										<span className='text-sm'>No thumbnail</span>
									</div>
								)}

								{/* Overlay info on hover */}
								<div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-end'>
									<div className='p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity'>
										<div className='flex items-center gap-2'>
											<span className='px-2 py-0.5 bg-blue-600 rounded text-xs'>
												{item.type}
											</span>
											{item.private && (
												<span className='px-2 py-0.5 bg-red-600 rounded text-xs'>
													Private
												</span>
											)}
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
