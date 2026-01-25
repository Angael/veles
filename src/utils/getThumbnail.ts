type ThumbnailType = 'XS' | 'SM' | 'MD';

interface Thumbnail {
	id: number;
	path: string;
	width: number;
	height: number;
	type: ThumbnailType;
}

export function getThumbnail(
	thumbnails: Thumbnail[],
	preferredType: ThumbnailType = 'MD',
): Thumbnail | undefined {
	if (thumbnails.length === 0) return undefined;

	// Try preferred type first
	const preferred = thumbnails.find((t) => t.type === preferredType);
	if (preferred) return preferred;

	// Fallback order: MD -> SM -> XS
	const fallbackOrder: ThumbnailType[] = ['MD', 'SM', 'XS'];
	for (const type of fallbackOrder) {
		const found = thumbnails.find((t) => t.type === type);
		if (found) return found;
	}

	// Return first available
	return thumbnails[0];
}
