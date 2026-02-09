import { clientEnv } from '../../env-client';

export const s3PathToUrl = (s3Path: string | undefined): string =>
	`${clientEnv.VITE_CF_CDN_URL}/${s3Path}`;
