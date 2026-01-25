import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { desc, eq, lt } from 'drizzle-orm';
import { db } from '@/db';
import { items, thumbnails } from '@/db/schema';
import { getThumbnail } from '@/utils/getThumbnail';
import { s3PathToUrl } from '@/utils/s3PathToUrl';

const DEFAULT_PAGE_SIZE = 24;

type ThumbnailSelect = Pick<
	typeof thumbnails.$inferSelect,
	'id' | 'path' | 'width' | 'height' | 'type'
>;

type MediaItem = Pick<
	typeof items.$inferSelect,
	'id' | 'type' | 'private' | 'createdAt'
> & {
	thumbnails: ThumbnailSelect[];
};

type PaginatedResponse = {
	items: MediaItem[];
	nextCursor: number | null;
	hasMore: boolean;
};

const getMediaItems = createServerFn({ method: 'GET' })
	.validator((data: { cursor?: number; limit?: number }) => data)
	.handler(async ({ data }): Promise<PaginatedResponse> => {
		const limit = data.limit ?? DEFAULT_PAGE_SIZE;
		const cursor = data.cursor;

		// Fetch one extra to determine if there are more items
		const fetchLimit = limit + 1;

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
			.where(cursor ? lt(items.id, cursor) : undefined)
			.orderBy(desc(items.id))
			.limit(fetchLimit);

		// Group thumbnails by item
		const itemsMap = new Map<number, MediaItem>();

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

			if (row.thumbnail?.id) {
				const item = itemsMap.get(row.id);
				if (item && row.thumbnail) {
					item.thumbnails.push(row.thumbnail);
				}
			}
		}

		const allItems = Array.from(itemsMap.values());
		const hasMore = allItems.length > limit;
		const paginatedItems = hasMore ? allItems.slice(0, limit) : allItems;
		const nextCursor =
			hasMore && paginatedItems.length > 0
				? paginatedItems[paginatedItems.length - 1].id
				: null;

		return {
			items: paginatedItems,
			nextCursor,
			hasMore,
		};
	});

export const Route = createFileRoute('/media/')({
	component: MediaPage,
	loader: () => getMediaItems({ data: {} }),
});

function MediaPage() {
	const initialData = Route.useLoaderData();
	const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialData.items);
	const [cursor, setCursor] = useState<number | null>(initialData.nextCursor);
	const [hasMore, setHasMore] = useState(initialData.hasMore);
	const [isLoading, setIsLoading] = useState(false);

	const loadMore = async () => {
		if (!cursor || isLoading) return;

		setIsLoading(true);
		try {
			const response = await getMediaItems({ data: { cursor } });
			setMediaItems((prev) => [...prev, ...response.items]);
			setCursor(response.nextCursor);
			setHasMore(response.hasMore);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-zinc-950 p-6'>
			<h1 className='text-3xl font-bold mb-6 text-violet-400'>Media</h1>

			{mediaItems.length === 0 ? (
				<div className='text-gray-500 text-center py-12'>
					No media items found
				</div>
			) : (
				<>
					<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
						{mediaItems.map((item) => {
							const thumbnail = getThumbnail(item.thumbnails, 'MD');

							return (
								<Link
									key={item.id}
									to='/media/$id'
									params={{ id: item.id.toString() }}
									className='relative aspect-square bg-zinc-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-violet-500 transition-all cursor-pointer group border border-violet-900/20'
								>
									{thumbnail ? (
										<img
											src={s3PathToUrl(thumbnail.path)}
											alt={`Media item ${item.id}`}
											className='w-full h-full object-cover'
										/>
									) : (
										<div className='w-full h-full flex items-center justify-center text-gray-400'>
											<span className='text-sm'>No thumbnail</span>
										</div>
									)}

									{/* Overlay info on hover */}
									<div className='absolute inset-0 flex items-end'>
										<div className='p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity'>
											<div className='flex items-center gap-2'>
												<span className='px-2 py-0.5 bg-violet-600 rounded text-xs'>
													{item.type}
												</span>
												{item.private && (
													<span className='px-2 py-0.5 bg-fuchsia-600 rounded text-xs'>
														Private
													</span>
												)}
											</div>
										</div>
									</div>
								</Link>
							);
						})}
					</div>

					{hasMore && (
						<div className='flex justify-center mt-8'>
							<button
								type='button'
								onClick={loadMore}
								disabled={isLoading}
								className='px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors'
							>
								{isLoading ? 'Loading...' : 'Load More'}
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
