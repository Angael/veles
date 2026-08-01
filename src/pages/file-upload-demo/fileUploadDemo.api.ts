import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createMiddleware, createServerFn } from '@tanstack/react-start';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { logMiddleware } from '@/lib/middleware/logMiddleware';

export const FILE_UPLOAD_DEMO_MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const MAX_MULTIPART_REQUEST_BYTES = 52 * 1024 * 1024;

const uploadDirectory = join(tmpdir(), 'veles-file-upload-demo');
const contentLengthType = type('string.numeric.parse |> number.integer >= 0');
const formDataType = type('FormData');
const filesType = type('File[] > 0').narrow((files, context) => {
  if (files.some((file) => file.size === 0)) {
    return context.mustBe('a list of non-empty files');
  }

  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  return (
    totalBytes <= FILE_UPLOAD_DEMO_MAX_TOTAL_BYTES ||
    context.mustBe('a file list no larger than 50 MiB in total')
  );
});

const limitUploadRequestMiddleware = createMiddleware().server(async ({ next, request }) => {
  const contentLength = contentLengthType(request.headers.get('content-length') ?? '');

  if (contentLength instanceof type.errors) {
    throw new ClientSafeError('Upload rejected: Content-Length is required.');
  }

  if (contentLength > MAX_MULTIPART_REQUEST_BYTES) {
    throw new ClientSafeError('Upload rejected: request body is too large.');
  }

  return next();
});

export const uploadFiles = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('uploadFilesDemo'), limitUploadRequestMiddleware])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const files = data.getAll('files').filter((value): value is File => value instanceof File);
    const validation = filesType(files);

    if (validation instanceof type.errors) {
      throw new ClientSafeError(
        'Upload rejected: select non-empty files totaling no more than 50 MiB.',
      );
    }

    await mkdir(uploadDirectory, { recursive: true });
    const savedFiles = await Promise.all(validation.map(saveFile));

    return { directory: uploadDirectory, files: savedFiles };
  });

/** Writes one uploaded file to the demo directory using a collision-resistant safe name. */
async function saveFile(file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'file';
  const savedPath = join(uploadDirectory, `${crypto.randomUUID()}-${safeName}`);

  await writeFile(savedPath, Buffer.from(await file.arrayBuffer()));

  return { originalName: file.name, savedPath, size: file.size };
}
