import type { thumbnails, thumbnailTypeEnum } from '@/db/schema';

type ThumbnailType = (typeof thumbnailTypeEnum.enumValues)[number];
type Thumbnail = Pick<
	typeof thumbnails.$inferSelect,
	'id' | 'path' | 'width' | 'height' | 'type'
>;

export function getThumbnail(
	thumbnails: Thumbnail[],
	preferredType: ThumbnailType = 'MD',
): Thumbnail | undefined {
	if (thumbnails.length === 0) return undefined;

	const preferred = thumbnails.find((t) => t.type === preferredType);
	if (preferred) return preferred;

	// Fallback: MD -> SM -> XS
	const fallbackOrder: ThumbnailType[] = ['MD', 'SM', 'XS'];
	for (const type of fallbackOrder) {
		const found = thumbnails.find((t) => t.type === type);
		if (found) return found;
	}

	return thumbnails[0];
}
