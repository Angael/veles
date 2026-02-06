import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { db } from '@/db';
import { fileUploads } from '@/db/schema';
import { auth } from '@/lib/auth/auth';
import { createPresignedUploadUrl, MAX_FILE_SIZE } from '@/lib/r2/presign';

type UploadRequest = {
	fileName: string;
	contentType: string;
	size: number;
};

export type PresignedUploadResponse = {
	uploadUrl: string;
	fileUploadId: number;
	r2Key: string;
};

export const requestUploadUrl = createServerFn({ method: 'POST' })
	.inputValidator((data: UploadRequest): UploadRequest => {
		if (!data.fileName || !data.contentType || !data.size) {
			throw new Error('Missing required fields: fileName, contentType, size');
		}
		if (data.size > MAX_FILE_SIZE) {
			throw new Error(
				`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024} MB`,
			);
		}
		return data;
	})
	.handler(async ({ data }): Promise<PresignedUploadResponse> => {
		const request = getRequest();
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session?.user?.id) {
			throw new Error('Unauthorized');
		}

		const userId = session.user.id;
		const timestamp = Date.now();
		const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
		const r2Key = `uploads/${userId}/${timestamp}-${safeName}`;

		const uploadUrl = await createPresignedUploadUrl({
			key: r2Key,
			contentType: data.contentType,
			contentLength: data.size,
		});

		const [inserted] = await db
			.insert(fileUploads)
			.values({
				userId,
				originalName: data.fileName,
				r2Key,
				contentType: data.contentType,
				size: data.size,
				status: 'PENDING',
			})
			.returning({ id: fileUploads.id });

		return {
			uploadUrl,
			fileUploadId: inserted.id,
			r2Key,
		};
	});

export const confirmUpload = createServerFn({ method: 'POST' })
	.inputValidator(
		(data: { fileUploadId: number }): { fileUploadId: number } => {
			if (!data.fileUploadId) {
				throw new Error('Missing fileUploadId');
			}
			return data;
		},
	)
	.handler(async ({ data }) => {
		const request = getRequest();
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session?.user?.id) {
			throw new Error('Unauthorized');
		}

		const { eq, and } = await import('drizzle-orm');

		await db
			.update(fileUploads)
			.set({ status: 'UPLOADED', updatedAt: new Date() })
			.where(
				and(
					eq(fileUploads.id, data.fileUploadId),
					eq(fileUploads.userId, session.user.id),
				),
			);

		return { success: true };
	});
