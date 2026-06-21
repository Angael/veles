import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getStorageConfig } from './config';

type UploadFileByKeyInput = {
  body: Blob | Buffer | Uint8Array;
  contentType?: string;
  key: string;
};

let r2Client: S3Client | null = null;

export async function uploadFileByKey({ body, contentType, key }: UploadFileByKeyInput) {
  const { bucketName } = getRequiredStorageConfig();

  await getR2Client().send(
    new PutObjectCommand({
      Body: body,
      Bucket: bucketName,
      ContentType: contentType,
      Key: key,
    }),
  );
}

export async function getFileByKey(key: string) {
  const { bucketName } = getRequiredStorageConfig();

  return getR2Client().send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
}

export async function deleteFileByKey(key: string) {
  const { bucketName } = getRequiredStorageConfig();

  await getR2Client().send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}

function getR2Client() {
  if (!r2Client) {
    const { accessKeyId, accountId, secretAccessKey } = getRequiredStorageConfig();

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

function getRequiredStorageConfig() {
  const { accessKeyId, accountId, bucketName, secretAccessKey } = getStorageConfig();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('R2 storage is not configured');
  }

  return { accessKeyId, accountId, bucketName, secretAccessKey };
}
