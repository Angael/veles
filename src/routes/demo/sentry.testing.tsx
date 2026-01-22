import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/demo/sentry/testing')({
	component: () => (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center p-8">
				<h1 className="text-2xl font-bold">Demo removed</h1>
				<p className="text-sm mt-2">
					This demo has been removed from the project.
				</p>
			</div>
		</div>
	),
});
