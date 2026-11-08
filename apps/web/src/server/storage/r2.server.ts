import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getStorageConfig } from './config.server';

type UploadFileByKeyInput = {
  body: Blob | Buffer | Uint8Array;
  contentType?: string;
  key: string;
};

let r2Client: S3Client | null = null;

export async function uploadFileByKey({ body, contentType, key }: UploadFileByKeyInput) {
  await getR2Client().send(
    new PutObjectCommand({
      Body: body,
      Bucket: getStorageConfig().bucketName,
      ContentType: contentType,
      Key: key,
    }),
  );
}

export async function deleteFileByKey(key: string) {
  await getR2Client().send(
    new DeleteObjectCommand({ Bucket: getStorageConfig().bucketName, Key: key }),
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
