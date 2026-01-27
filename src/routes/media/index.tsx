import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import { getThumbnail } from '@/utils/getThumbnail';
import { s3PathToUrl } from '@/utils/s3PathToUrl';
import { getMediaItems, type MediaItem } from './-api';

const GAP = 16;
const SCROLL_STORAGE_KEY = 'media-scroll-position';

export const Route = createFileRoute('/media/')({
	component: MediaPage,
	loader: () => getMediaItems({ data: {} }),
});

function MediaPage() {
	const initialData = Route.useLoaderData();
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const columns = useResponsiveColumns();

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery({
			queryKey: ['media'],
			queryFn: ({ pageParam }) =>
				getMediaItems({ data: { cursor: pageParam } }),
			initialPageParam: undefined as number | undefined,
			getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
			initialData: { pages: [initialData], pageParams: [undefined] },
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
		});

	const mediaItems = data?.pages.flatMap((page) => page.items) ?? [];
	const rowCount = Math.ceil(mediaItems.length / columns);

	const estimateRowSize = useCallback(() => {
		if (!listRef.current) return 200;
		const containerWidth = listRef.current.offsetWidth;
		const itemWidth = (containerWidth - GAP * (columns - 1)) / columns;
		return itemWidth + GAP;
	}, [columns]);

	const virtualizer = useWindowVirtualizer({
		count: rowCount,
		estimateSize: estimateRowSize,
		overscan: 2,
	});

	// Re-measure rows when container resizes
	useEffect(() => {
		const element = listRef.current;
		if (!element) return;
		const observer = new ResizeObserver(() => virtualizer.measure());
		observer.observe(element);
		return () => observer.disconnect();
	}, [virtualizer]);

	// Restore scroll position on mount
	const hasRestoredScroll = useRef(false);
	useLayoutEffect(() => {
		if (hasRestoredScroll.current) return;
		const saved = sessionStorage.getItem(SCROLL_STORAGE_KEY);
		if (saved) {
			const scrollY = Number.parseInt(saved, 10);
			requestAnimationFrame(() => {
				window.scrollTo(0, scrollY);
				hasRestoredScroll.current = true;
			});
			sessionStorage.removeItem(SCROLL_STORAGE_KEY);
		}
	}, []);

	const saveScrollPosition = useCallback(() => {
		sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
	}, []);

	// Infinite scroll trigger
	useEffect(() => {
		const element = loadMoreRef.current;
		if (!element) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ rootMargin: '200px' },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const virtualRows = virtualizer.getVirtualItems();

	if (mediaItems.length === 0) {
		return (
			<div className='min-h-screen bg-zinc-950 p-6 container mx-auto'>
				<h1 className='text-3xl font-bold mb-6 text-violet-400'>Media</h1>
				<div className='text-gray-500 text-center py-12'>
					No media items found
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-zinc-950 p-6 container mx-auto'>
			<h1 className='text-3xl font-bold mb-6 text-violet-400'>Media</h1>

			<div
				ref={listRef}
				style={{ height: `${virtualizer.getTotalSize()}px` }}
				className='relative w-full'
			>
				{virtualRows.map((virtualRow) => {
					const startIndex = virtualRow.index * columns;
					const rowItems = mediaItems.slice(startIndex, startIndex + columns);

					return (
						<div
							key={virtualRow.key}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start}px)`,
							}}
							className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
						>
							{rowItems.map((item) => (
								<MediaItemCard
									key={item.id}
									item={item}
									onNavigate={saveScrollPosition}
								/>
							))}
						</div>
					);
				})}
			</div>

			<div ref={loadMoreRef} className='h-1' />

			{isFetchingNextPage && (
				<div className='flex justify-center mt-8'>
					<div className='text-gray-400'>Loading more...</div>
				</div>
			)}

			{hasNextPage && !isFetchingNextPage && (
				<div className='flex justify-center mt-8'>
					<button
						type='button'
						onClick={() => fetchNextPage()}
						className='px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors'
					>
						Load More
					</button>
				</div>
			)}
		</div>
	);
}

function MediaItemCard({
	item,
	onNavigate,
}: {
	item: MediaItem;
	onNavigate: () => void;
}) {
	const thumbnail = getThumbnail(item.thumbnails, 'MD');

	return (
		<Link
			to='/media/$id'
			params={{ id: item.id.toString() }}
			onClick={onNavigate}
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
}
