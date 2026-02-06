import { AlertCircle, CheckCircle, FileIcon, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { type FileRejection, useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

type FileUploadState = {
	file: File;
	progress: number;
	status: 'pending' | 'uploading' | 'success' | 'error';
	error?: string;
};

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({
	onUpload,
	accept,
	maxFiles = 10,
}: {
	onUpload: (file: File) => Promise<void>;
	accept?: Record<string, string[]>;
	maxFiles?: number;
}) {
	const [files, setFiles] = useState<FileUploadState[]>([]);

	const uploadFile = useCallback(
		async (file: File, index: number) => {
			setFiles((prev) =>
				prev.map((f, i) =>
					i === index ? { ...f, status: 'uploading' as const, progress: 0 } : f,
				),
			);

			try {
				await onUpload(file);
				setFiles((prev) =>
					prev.map((f, i) =>
						i === index
							? { ...f, status: 'success' as const, progress: 100 }
							: f,
					),
				);
			} catch (err) {
				setFiles((prev) =>
					prev.map((f, i) =>
						i === index
							? {
									...f,
									status: 'error' as const,
									error: err instanceof Error ? err.message : 'Upload failed',
								}
							: f,
					),
				);
			}
		},
		[onUpload],
	);

	const onDrop = useCallback(
		(acceptedFiles: File[], rejections: FileRejection[]) => {
			const newFiles: FileUploadState[] = acceptedFiles.map((file) => ({
				file,
				progress: 0,
				status: 'pending' as const,
			}));

			const rejectedFiles: FileUploadState[] = rejections.map((r) => ({
				file: r.file,
				progress: 0,
				status: 'error' as const,
				error: r.errors.map((e) => e.message).join(', '),
			}));

			const startIndex = files.length;
			setFiles((prev) => [...prev, ...newFiles, ...rejectedFiles]);

			for (let i = 0; i < acceptedFiles.length; i++) {
				uploadFile(acceptedFiles[i], startIndex + i);
			}
		},
		[files.length, uploadFile],
	);

	const removeFile = useCallback((index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		maxSize: MAX_FILE_SIZE,
		maxFiles,
		accept,
	});

	return (
		<div className='space-y-4'>
			<div
				{...getRootProps()}
				className={cn(
					'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
					isDragActive
						? 'border-violet-500 bg-violet-900/20'
						: 'border-zinc-700 hover:border-violet-600 hover:bg-violet-900/10',
				)}
			>
				<input {...getInputProps()} />
				<Upload
					className={cn(
						'mb-3 h-10 w-10',
						isDragActive ? 'text-violet-400' : 'text-gray-400',
					)}
				/>
				{isDragActive ? (
					<p className='text-violet-400 font-medium'>Drop files here...</p>
				) : (
					<>
						<p className='text-gray-300 font-medium'>
							Drag & drop files here, or click to select
						</p>
						<p className='mt-1 text-sm text-gray-400'>
							Max file size: {formatFileSize(MAX_FILE_SIZE)}
						</p>
					</>
				)}
			</div>

			{files.length > 0 && (
				<div className='space-y-2'>
					{files.map((fileState, index) => (
						<div
							key={`${fileState.file.name}-${index}`}
							className='flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3'
						>
							<FileIcon className='h-5 w-5 shrink-0 text-gray-400' />
							<div className='min-w-0 flex-1'>
								<div className='flex items-center justify-between'>
									<p className='truncate text-sm text-gray-200'>
										{fileState.file.name}
									</p>
									<span className='ml-2 shrink-0 text-xs text-gray-400'>
										{formatFileSize(fileState.file.size)}
									</span>
								</div>
								{fileState.status === 'uploading' && (
									<Progress value={fileState.progress} className='mt-2' />
								)}
								{fileState.status === 'error' && (
									<p className='mt-1 text-xs text-red-400'>{fileState.error}</p>
								)}
							</div>
							<div className='shrink-0'>
								{fileState.status === 'success' && (
									<CheckCircle className='h-5 w-5 text-green-500' />
								)}
								{fileState.status === 'error' && (
									<AlertCircle className='h-5 w-5 text-red-500' />
								)}
								{(fileState.status === 'success' ||
									fileState.status === 'error') && (
									<Button
										variant='ghost'
										size='icon'
										className='h-7 w-7'
										onClick={(e) => {
											e.stopPropagation();
											removeFile(index);
										}}
									>
										<X className='h-4 w-4' />
									</Button>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
