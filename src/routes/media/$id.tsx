import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { images, items, thumbnails, videos } from '@/db/schema';
import { getThumbnail } from '@/utils/getThumbnail';
import { s3PathToUrl } from '@/utils/s3PathToUrl';

const getMediaItem = createServerFn({ method: 'GET' })
	.inputValidator((d: number) => d)
	.handler(async ({ data: itemId }) => {
		const [item] = await db
			.select({
				id: items.id,
				type: items.type,
				private: items.private,
				createdAt: items.createdAt,
			})
			.from(items)
			.where(eq(items.id, itemId))
			.limit(1);

		if (!item) {
			throw new Error('Item not found');
		}

		const itemThumbnails = await db
			.select({
				id: thumbnails.id,
				path: thumbnails.path,
				width: thumbnails.width,
				height: thumbnails.height,
				type: thumbnails.type,
			})
			.from(thumbnails)
			.where(eq(thumbnails.itemId, itemId))
			.orderBy(thumbnails.width);

		if (item.type === 'IMAGE') {
			const itemImages = await db
				.select({
					id: images.id,
					path: images.path,
					width: images.width,
					height: images.height,
					mediaType: images.mediaType,
				})
				.from(images)
				.where(eq(images.itemId, itemId));

			return {
				...item,
				thumbnails: itemThumbnails,
				images: itemImages,
				videos: [],
			};
		}

		const itemVideos = await db
			.select({
				id: videos.id,
				path: videos.path,
				width: videos.width,
				height: videos.height,
				mediaType: videos.mediaType,
				durationMs: videos.durationMs,
			})
			.from(videos)
			.where(eq(videos.itemId, itemId));

		return {
			...item,
			thumbnails: itemThumbnails,
			images: [],
			videos: itemVideos,
		};
	});

export const Route = createFileRoute('/media/$id')({
	component: MediaItemPage,
	loader: ({ params }) => getMediaItem({ data: Number(params.id) }),
});

function MediaItemPage() {
	const mediaItem = Route.useLoaderData();
	const thumbnail = getThumbnail(mediaItem.thumbnails, 'MD');
	const isImage = mediaItem.type === 'IMAGE';
	const mainMedia = isImage ? mediaItem.images[0] : mediaItem.videos[0];

	return (
		<div className='min-h-screen bg-zinc-950 p-6'>
			<div className='max-w-7xl mx-auto'>
				<div className='mb-4 flex items-center gap-2'>
					<span className='px-2 py-0.5 bg-violet-600 rounded text-xs text-white'>
						{mediaItem.type}
					</span>
					{mediaItem.private && (
						<span className='px-2 py-0.5 bg-fuchsia-600 rounded text-xs text-white'>
							Private
						</span>
					)}
				</div>

				<div className='bg-zinc-900 rounded-lg overflow-hidden border border-violet-900/20'>
					{isImage && mainMedia ? (
						<div
							className='relative w-full'
							style={{
								aspectRatio: `${mainMedia.width} / ${mainMedia.height}`,
							}}
						>
							{thumbnail && (
								<img
									src={s3PathToUrl(thumbnail.path)}
									alt='Thumbnail'
									className='absolute inset-0 w-full h-full object-contain blur-xl scale-110'
									aria-hidden='true'
								/>
							)}
							<img
								src={s3PathToUrl(mainMedia.path)}
								alt={`Media item ${mediaItem.id}`}
								className='relative w-full h-full object-contain'
								loading='lazy'
							/>
						</div>
					) : mainMedia ? (
						<div
							className='relative w-full'
							style={{
								aspectRatio: `${mainMedia.width} / ${mainMedia.height}`,
							}}
						>
							{/* biome-ignore lint/a11y/useMediaCaption: Videos don't have captions */}
							<video
								autoPlay
								src={s3PathToUrl(mainMedia.path)}
								poster={thumbnail ? s3PathToUrl(thumbnail.path) : undefined}
								controls
								className='w-full h-full object-contain'
							/>
						</div>
					) : (
						<div className='w-full h-96 flex items-center justify-center text-gray-400'>
							<span>No media available</span>
						</div>
					)}
				</div>

				{mainMedia && (
					<div className='mt-4 text-gray-400 text-sm'>
						<p>
							Dimensions: {mainMedia.width} × {mainMedia.height}
						</p>
						{!isImage &&
							'durationMs' in mainMedia &&
							typeof mainMedia.durationMs === 'number' && (
								<p>Duration: {Math.round(mainMedia.durationMs / 1000)}s</p>
							)}
						{mediaItem.createdAt && (
							<p>
								Uploaded: {new Date(mediaItem.createdAt).toLocaleDateString()}
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
