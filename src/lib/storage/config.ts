import { getServerEnv } from '@/lib/env/server';

export function getStorageConfig() {
  const env = getServerEnv();

  return {
    accountId: env.r2AccountId,
    accessKeyId: env.r2AccessKeyId,
    secretAccessKey: env.r2SecretAccessKey,
    bucketName: env.r2BucketName,
    publicUrl: env.r2PublicUrl || env.cdnUrl,
  };
}

export function storagePathToUrl(path: string | null | undefined) {
  const { publicUrl } = getStorageConfig();

  if (!path || !publicUrl) {
    return null;
  }

  return `${publicUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
