import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { getNotes, saveNote } from './server-functions';

export const Route = createFileRoute('/notes/index-server-fn')({
	component: NotesPageServerFn,
});

function NotesPageServerFn() {
	const [content, setContent] = useState('');
	const queryClient = useQueryClient();

	const { data: notes, isLoading } = useQuery({
		queryKey: ['notes-server-fn'],
		queryFn: () => getNotes(),
	});

	const saveMutation = useMutation({
		mutationFn: (noteContent: string) =>
			saveNote({ data: { content: noteContent } }),
		onSuccess: () => {
			setContent('');
			queryClient.invalidateQueries({ queryKey: ['notes-server-fn'] });
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		saveMutation.mutate(content);
	};

	return (
		<div className='min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-12 px-6'>
			<div className='max-w-2xl mx-auto'>
				<h1 className='text-4xl font-bold text-white mb-8'>
					Notes (Server Functions)
				</h1>

				<form onSubmit={handleSubmit} className='space-y-4 mb-8'>
					<textarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder='Write your note here...'
						className='w-full h-64 bg-slate-800 border border-slate-700 rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 resize-none'
						required
					/>

					<button
						type='submit'
						disabled={saveMutation.isPending}
						className='px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-700 text-white font-semibold rounded-lg transition-colors'
					>
						{saveMutation.isPending ? 'Saving...' : 'Save Note'}
					</button>

					{saveMutation.isSuccess && (
						<p className='text-green-400'>Note saved successfully!</p>
					)}
					{saveMutation.isError && (
						<p className='text-red-400'>
							Failed to save note. Please try again.
						</p>
					)}
				</form>

				<div className='space-y-4'>
					<h2 className='text-2xl font-bold text-white'>Saved Notes</h2>
					{isLoading && <p className='text-gray-400'>Loading notes...</p>}
					{notes && notes.length === 0 && (
						<p className='text-gray-400'>
							No notes yet. Create your first note!
						</p>
					)}
					{notes?.map(
						(note: { id: number; content: string; createdAt: Date | null }) => (
							<div
								key={note.id}
								className='bg-slate-800 border border-slate-700 rounded-lg p-4'
							>
								<p className='text-white whitespace-pre-wrap'>{note.content}</p>
								{note.createdAt && (
									<p className='text-gray-400 text-sm mt-2'>
										{note.createdAt.toLocaleString()}
									</p>
								)}
							</div>
						),
					)}
				</div>
			</div>
		</div>
	);
}
