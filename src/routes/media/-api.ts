import { createServerFn } from '@tanstack/react-start';
import { desc, inArray, lt } from 'drizzle-orm';
import { db } from '@/db';
import { items, thumbnails } from '@/db/schema';

const DEFAULT_PAGE_SIZE = 48;

export type ThumbnailSelect = Pick<
	typeof thumbnails.$inferSelect,
	'id' | 'path' | 'width' | 'height' | 'type'
>;

export type MediaItem = Pick<
	typeof items.$inferSelect,
	'id' | 'type' | 'private' | 'createdAt'
> & {
	thumbnails: ThumbnailSelect[];
};

export type PaginatedResponse = {
	items: MediaItem[];
	nextCursor: number | null;
	hasMore: boolean;
};

export const getMediaItems = createServerFn({ method: 'GET' })
	.inputValidator((data: { cursor?: number; limit?: number }) => data)
	.handler(async ({ data }): Promise<PaginatedResponse> => {
		const limit = data.limit ?? DEFAULT_PAGE_SIZE;
		const cursor = data.cursor;

		const fetchLimit = limit + 1;

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

		const mediaItems: MediaItem[] = paginatedItems.map((item) => ({
			...item,
			thumbnails: thumbnailsByItemId.get(item.id) ?? [],
		}));

		const nextCursor =
			hasMore && paginatedItems.length > 0
				? paginatedItems[paginatedItems.length - 1].id
				: null;

		return { items: mediaItems, nextCursor, hasMore };
	});
