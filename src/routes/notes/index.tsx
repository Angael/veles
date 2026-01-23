import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { saveNote } from './server-functions';

export const Route = createFileRoute('/notes/')({ component: NotesPage });

type Note = {
	id: number;
	content: string;
	createdAt: string | null;
};

function NotesPage() {
	const [content, setContent] = useState('');
	const queryClient = useQueryClient();

	const { data: notes, isLoading } = useQuery({
		queryKey: ['notes'],
		queryFn: async () => {
			const response = await fetch('/notes/api/notes');
			if (!response.ok) throw new Error('Failed to fetch notes');
			return response.json() as Promise<Note[]>;
		},
	});

	const saveMutationFetch = useMutation({
		mutationFn: async (noteContent: string) => {
			const response = await fetch('/notes/api/save', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: noteContent }),
			});
			if (!response.ok) throw new Error('Failed to save note');
			return response.json();
		},
		onSuccess: () => {
			setContent('');
			queryClient.invalidateQueries({ queryKey: ['notes'] });
		},
	});

	const saveMutationServerFn = useMutation({
		mutationFn: (noteContent: string) =>
			saveNote({ data: { content: noteContent } }),
		onSuccess: () => {
			setContent('');
			queryClient.invalidateQueries({ queryKey: ['notes'] });
		},
	});

	const handleSubmitFetch = async (e: React.FormEvent) => {
		e.preventDefault();
		saveMutationFetch.mutate(content);
	};

	const handleSubmitServerFn = async (e: React.FormEvent) => {
		e.preventDefault();
		saveMutationServerFn.mutate(content);
	};

	return (
		<div className='min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-12 px-6'>
			<div className='max-w-2xl mx-auto'>
				<h1 className='text-4xl font-bold text-white mb-8'>Notes</h1>

				<div className='space-y-4 mb-8'>
					<textarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder='Write your note here...'
						className='w-full h-64 bg-slate-800 border border-slate-700 rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 resize-none'
						required
					/>

					<div className='flex gap-4'>
						<form onSubmit={handleSubmitFetch} className='flex-1'>
							<button
								type='submit'
								disabled={saveMutationFetch.isPending}
								className='w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-700 text-white font-semibold rounded-lg transition-colors'
							>
								{saveMutationFetch.isPending ? 'Saving...' : 'Save (API Route)'}
							</button>
						</form>

						<form onSubmit={handleSubmitServerFn} className='flex-1'>
							<button
								type='submit'
								disabled={saveMutationServerFn.isPending}
								className='w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-700 text-white font-semibold rounded-lg transition-colors'
							>
								{saveMutationServerFn.isPending
									? 'Saving...'
									: 'Save (Server Fn)'}
							</button>
						</form>
					</div>

					{(saveMutationFetch.isSuccess || saveMutationServerFn.isSuccess) && (
						<p className='text-green-400'>Note saved successfully!</p>
					)}
					{(saveMutationFetch.isError || saveMutationServerFn.isError) && (
						<p className='text-red-400'>
							Failed to save note. Please try again.
						</p>
					)}
				</div>

				<div className='space-y-4'>
					<h2 className='text-2xl font-bold text-white'>Saved Notes</h2>
					{isLoading && <p className='text-gray-400'>Loading notes...</p>}
					{notes && notes.length === 0 && (
						<p className='text-gray-400'>
							No notes yet. Create your first note!
						</p>
					)}
					{notes?.map((note) => (
						<div
							key={note.id}
							className='bg-slate-800 border border-slate-700 rounded-lg p-4'
						>
							<p className='text-white whitespace-pre-wrap'>{note.content}</p>
							{note.createdAt && (
								<p className='text-gray-400 text-sm mt-2'>
									{new Date(note.createdAt).toLocaleString()}
								</p>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
