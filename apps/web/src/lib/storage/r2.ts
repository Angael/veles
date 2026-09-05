import {
  DeleteObjectCommand,
  GetObjectCommand,
  type GetObjectCommandOutput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getStorageConfig } from './config';

type StorageBucket = 'private' | 'public';

type UploadFileByKeyInput = {
  body: Blob | Buffer | Uint8Array;
  contentType?: string;
  key: string;
  bucket: StorageBucket;
};

let r2Client: S3Client | null = null;

export async function uploadFileByKey({ body, bucket, contentType, key }: UploadFileByKeyInput) {
  // TODO: Add private bucket storage when it is needed.
  if (bucket === 'private') return;

  await getR2Client().send(
    new PutObjectCommand({
      Body: body,
      Bucket: getStorageConfig().bucketName,
      ContentType: contentType,
      Key: key,
    }),
  );
}

export async function deleteFileByKey(key: string, bucket: StorageBucket) {
  // TODO: Add private bucket storage when it is needed.
  if (bucket === 'private') return;

  await getR2Client().send(
    new DeleteObjectCommand({ Bucket: getStorageConfig().bucketName, Key: key }),
  );
}

export async function getFileByKey(
  key: string,
  bucket: StorageBucket,
): Promise<GetObjectCommandOutput | undefined> {
  // TODO: Add private bucket storage when it is needed.
  if (bucket === 'private') return;

  return getR2Client().send(
    new GetObjectCommand({ Bucket: getStorageConfig().bucketName, Key: key }),
  );
}

function getR2Client() {
  if (!r2Client) {
    const { accessKeyId, accountId, secretAccessKey } = getStorageConfig();

    r2Client = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
    });
  }

  return r2Client;
}
