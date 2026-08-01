import { createFileRoute } from '@tanstack/react-router';
import { FileUploadDemoPage } from '@/pages/file-upload-demo/FileUploadDemoPage';

export const Route = createFileRoute('/demo/file-upload')({
  component: FileUploadDemoPage,
  staticData: { navbar: { label: 'File upload lab', upTo: { to: '/' } } },
});
