import { createFileRoute } from '@tanstack/react-router';
import { useCallback } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { useSession } from '@/lib/auth/client';
import { confirmUpload, requestUploadUrl } from './-api';

export const Route = createFileRoute('/upload/')({
	component: UploadPage,
});

function UploadPage() {
	const { data: session } = useSession();

	const handleUpload = useCallback(async (file: File) => {
		const { uploadUrl, fileUploadId } = await requestUploadUrl({
			data: {
				fileName: file.name,
				contentType: file.type || 'application/octet-stream',
				size: file.size,
			},
		});

		const response = await fetch(uploadUrl, {
			method: 'PUT',
			body: file,
			headers: {
				'Content-Type': file.type || 'application/octet-stream',
			},
		});

		if (!response.ok) {
			throw new Error(`Upload failed with status ${response.status}`);
		}

		await confirmUpload({
			data: { fileUploadId },
		});
	}, []);

	if (!session?.user) {
		return (
			<div className='mx-auto max-w-2xl px-4 py-12'>
				<p className='text-center text-gray-400'>
					Please sign in to upload files.
				</p>
			</div>
		);
	}

	return (
		<div className='mx-auto max-w-2xl px-4 py-12'>
			<h1 className='mb-2 text-2xl font-bold text-violet-400'>Upload Files</h1>
			<p className='mb-8 text-gray-400'>
				Upload files to be processed. Supported formats: images and videos.
			</p>
			<FileDropzone
				onUpload={handleUpload}
				accept={{
					'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
					'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
				}}
			/>
		</div>
	);
}
