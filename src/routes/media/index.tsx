import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { desc, inArray, lt } from 'drizzle-orm';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';
import { db } from '@/db';
import { items, thumbnails } from '@/db/schema';
import { getThumbnail } from '@/utils/getThumbnail';
import { s3PathToUrl } from '@/utils/s3PathToUrl';

const GAP = 16; // gap-4 = 1rem = 16px
const SCROLL_STORAGE_KEY = 'media-scroll-position';

// Breakpoints matching Tailwind's responsive grid
const BREAKPOINTS = [
	{ min: 1280, cols: 6 }, // xl
	{ min: 1024, cols: 5 }, // lg
	{ min: 768, cols: 4 }, // md
	{ min: 640, cols: 3 }, // sm
	{ min: 0, cols: 2 }, // default
] as const;

function useColumns() {
	const [columns, setColumns] = useState(2);

	useEffect(() => {
		const updateColumns = () => {
			const width = window.innerWidth;
			for (const bp of BREAKPOINTS) {
				if (width >= bp.min) {
					setColumns(bp.cols);
					return;
				}
			}
		};

		updateColumns();
		window.addEventListener('resize', updateColumns);
		return () => window.removeEventListener('resize', updateColumns);
	}, []);

	return columns;
}

const DEFAULT_PAGE_SIZE = 48;

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
	.inputValidator((data: { cursor?: number; limit?: number }) => data)
	.handler(async ({ data }): Promise<PaginatedResponse> => {
		const limit = data.limit ?? DEFAULT_PAGE_SIZE;
		const cursor = data.cursor;

		// Fetch one extra to determine if there are more items
		const fetchLimit = limit + 1;

		// First query: fetch items only (limit applies correctly to items)
		const itemsResult = await db
			.select({
				id: items.id,
				type: items.type,
				private: items.private,
				createdAt: items.createdAt,
			})
			.from(items)
			.where(cursor ? lt(items.id, cursor) : undefined)
			.orderBy(desc(items.id))
			.limit(fetchLimit);

		const hasMore = itemsResult.length > limit;
		const paginatedItems = hasMore ? itemsResult.slice(0, limit) : itemsResult;

		if (paginatedItems.length === 0) {
			return { items: [], nextCursor: null, hasMore: false };
		}

		const itemIds = paginatedItems.map((item) => item.id);

		// Second query: fetch thumbnails for the selected items
		const thumbnailsResult = await db
			.select({
				id: thumbnails.id,
				itemId: thumbnails.itemId,
				path: thumbnails.path,
				width: thumbnails.width,
				height: thumbnails.height,
				type: thumbnails.type,
			})
			.from(thumbnails)
			.where(inArray(thumbnails.itemId, itemIds));

		// Group thumbnails by itemId
		const thumbnailsByItemId = new Map<number, ThumbnailSelect[]>();
		for (const thumb of thumbnailsResult) {
			const existing = thumbnailsByItemId.get(thumb.itemId) ?? [];
			existing.push({
				id: thumb.id,
				path: thumb.path,
				width: thumb.width,
				height: thumb.height,
				type: thumb.type,
			});
			thumbnailsByItemId.set(thumb.itemId, existing);
		}

		// Merge items with their thumbnails
		const mediaItems: MediaItem[] = paginatedItems.map((item) => ({
			...item,
			thumbnails: thumbnailsByItemId.get(item.id) ?? [],
		}));

		const nextCursor =
			hasMore && paginatedItems.length > 0
				? paginatedItems[paginatedItems.length - 1].id
				: null;

		return {
			items: mediaItems,
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
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const columns = useColumns();

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery({
			queryKey: ['media'],
			queryFn: ({ pageParam }) =>
				getMediaItems({ data: { cursor: pageParam } }),
			initialPageParam: undefined as number | undefined,
			getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
			initialData: {
				pages: [initialData],
				pageParams: [undefined],
			},
			// Keep data in cache longer for better back navigation
			staleTime: 5 * 60 * 1000, // 5 minutes
			gcTime: 10 * 60 * 1000, // 10 minutes
		});

	const mediaItems = data?.pages.flatMap((page) => page.items) ?? [];
	const rowCount = Math.ceil(mediaItems.length / columns);

	// Calculate row height dynamically based on container width
	const estimateRowSize = useCallback(() => {
		if (!listRef.current) return 200; // fallback
		const containerWidth = listRef.current.offsetWidth;
		const itemWidth = (containerWidth - GAP * (columns - 1)) / columns;
		return itemWidth + GAP; // item height (square) + gap
	}, [columns]);

	const virtualizer = useWindowVirtualizer({
		count: rowCount,
		estimateSize: estimateRowSize,
		overscan: 2,
	});

	// Re-measure all rows when container resizes
	useEffect(() => {
		const element = listRef.current;
		if (!element) return;

		const resizeObserver = new ResizeObserver(() => {
			virtualizer.measure();
		});

		resizeObserver.observe(element);
		return () => resizeObserver.disconnect();
	}, [virtualizer]);

	const virtualRows = virtualizer.getVirtualItems();

	// Restore scroll position on mount (after virtualizer is ready)
	const hasRestoredScroll = useRef(false);
	useLayoutEffect(() => {
		if (hasRestoredScroll.current) return;
		const saved = sessionStorage.getItem(SCROLL_STORAGE_KEY);
		if (saved) {
			const scrollY = Number.parseInt(saved, 10);
			// Wait for virtualizer to calculate total size before scrolling
			requestAnimationFrame(() => {
				window.scrollTo(0, scrollY);
				hasRestoredScroll.current = true;
			});
			sessionStorage.removeItem(SCROLL_STORAGE_KEY);
		}
	}, []);

	// Save scroll position before navigating to detail page
	const saveScrollPosition = useCallback(() => {
		sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
	}, []);

	// Intersection Observer for infinite scroll
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

	return (
		<div className='min-h-screen bg-zinc-950 p-6 container mx-auto'>
			<h1 className='text-3xl font-bold mb-6 text-violet-400'>Media</h1>

			{mediaItems.length === 0 ? (
				<div className='text-gray-500 text-center py-12'>
					No media items found
				</div>
			) : (
				<>
					<div
						ref={listRef}
						style={{ height: `${virtualizer.getTotalSize()}px` }}
						className='relative w-full'
					>
						{virtualRows.map((virtualRow) => {
							const startIndex = virtualRow.index * columns;
							const rowItems = mediaItems.slice(
								startIndex,
								startIndex + columns,
							);

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
										<MediaItem
											key={item.id}
											item={item}
											onNavigate={saveScrollPosition}
										/>
									))}
								</div>
							);
						})}
					</div>

					{/* Sentinel element for infinite scroll (outside virtualized area) */}
					<div ref={loadMoreRef} className='h-1' />

					{/* Loading indicator */}
					{isFetchingNextPage && (
						<div className='flex justify-center mt-8'>
							<div className='text-gray-400'>Loading more...</div>
						</div>
					)}

					{/* Fallback button (shown when not fetching and there are more pages) */}
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
				</>
			)}
		</div>
	);
}

function MediaItem({
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
}
