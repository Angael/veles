import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from 'env.ts';
import { r2Client } from './client';

/** Maximum file size in bytes (100 MB) */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/** Signed URL expiration in seconds (10 minutes) */
const SIGNED_URL_EXPIRY = 600;

export async function createPresignedUploadUrl(params: {
	key: string;
	contentType: string;
	contentLength: number;
}) {
	const command = new PutObjectCommand({
		Bucket: env.R2_BUCKET_NAME,
		Key: params.key,
		ContentType: params.contentType,
		ContentLength: params.contentLength,
	});

	const signedUrl = await getSignedUrl(r2Client, command, {
		expiresIn: SIGNED_URL_EXPIRY,
	});

	return signedUrl;
}
