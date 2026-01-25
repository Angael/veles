import { env } from '../../env';

export const s3PathToUrl = (s3Path: string | undefined): string =>
	`${env.VITE_CF_CDN_URL}/${s3Path}`;
