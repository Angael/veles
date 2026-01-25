import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { items, thumbnails } from '@/db/schema';
import { getThumbnail } from '@/utils/getThumbnail';
import { s3PathToUrl } from '@/utils/s3PathToUrl';

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

	return Array.from(itemsMap.values());
});

export const Route = createFileRoute('/media/')({
	component: MediaPage,
	loader: () => getMediaItems(),
});

function MediaPage() {
	const mediaItems = Route.useLoaderData();

	return (
		<div className='min-h-screen bg-zinc-950 p-6'>
			<h1 className='text-3xl font-bold mb-6 text-violet-400'>Media</h1>

			{mediaItems.length === 0 ? (
				<div className='text-gray-500 text-center py-12'>
					No media items found
				</div>
			) : (
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
			)}
		</div>
	);
}
