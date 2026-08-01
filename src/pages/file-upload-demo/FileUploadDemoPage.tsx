import { useServerFn } from '@tanstack/react-start';
import { type FormEvent, useState } from 'react';
import { uploadFiles } from './fileUploadDemo.api';
import css from './FileUploadDemoPage.module.css';

type UploadResult = Awaited<ReturnType<typeof uploadFiles>>;

export function FileUploadDemoPage() {
  const upload = useServerFn(uploadFiles);
  const [result, setResult] = useState<UploadResult>();
  const [error, setError] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setResult(undefined);
    setIsUploading(true);

    try {
      const formData = new FormData(event.currentTarget);
      setResult(await upload({ data: formData }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className={css.page}>
      <h1>Server function file upload</h1>
      <p>
        Select multiple files. The server rejects a combined size above 50 MiB and saves accepted
        files in its temporary directory. There is no client-side size validation.
      </p>

      <form onSubmit={handleSubmit}>
        <input multiple name='files' required type='file' />
        <button disabled={isUploading} type='submit'>
          {isUploading ? 'Uploading…' : 'Upload files'}
        </button>
      </form>

      {error ? (
        <p className={css.error} role='alert'>
          {error}
        </p>
      ) : null}

      {result ? (
        <section aria-live='polite'>
          <h2>Saved to {result.directory}</h2>
          <ul>
            {result.files.map((file) => (
              <li key={file.savedPath}>
                {file.originalName} ({file.size} bytes) → <code>{file.savedPath}</code>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
