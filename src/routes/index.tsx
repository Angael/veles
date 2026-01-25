import { createFileRoute } from '@tanstack/react-router';
import { Image, Video, Zap } from 'lucide-react';

export const Route = createFileRoute('/')({ component: App });

function App() {
	const features = [
		{
			icon: <Image className='w-12 h-12 text-violet-400' />,
			title: 'Image Management',
			description:
				'Store and manage your images with automatic thumbnail generation and optimization.',
		},
		{
			icon: <Video className='w-12 h-12 text-violet-400' />,
			title: 'Video Support',
			description:
				'Upload and stream videos with poster thumbnails for instant preview.',
		},
		{
			icon: <Zap className='w-12 h-12 text-violet-400' />,
			title: 'Fast & Efficient',
			description:
				'Built with modern technologies for optimal performance and reliability.',
		},
	];

	return (
		<div className='min-h-screen bg-zinc-950'>
			<section className='relative py-20 px-6 text-center overflow-hidden'>
				<div className='absolute inset-0 bg-gradient-to-b from-violet-500/5 via-fuchsia-500/5 to-transparent'></div>
				<div className='relative max-w-5xl mx-auto'>
					<h1 className='text-6xl md:text-7xl font-black text-white mb-6'>
						<span className='text-violet-400'>Veles</span>
					</h1>
					<p className='text-2xl md:text-3xl text-gray-300 mb-4 font-light'>
						Media Management Platform
					</p>
					<p className='text-lg text-gray-400 max-w-3xl mx-auto mb-8'>
						A modern platform for storing, managing, and sharing your images and
						videos with automatic optimization and thumbnail generation.
					</p>
					<div className='flex flex-col items-center gap-4'>
						<a
							href='/media'
							className='px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-violet-500/50'
						>
							Browse Media
						</a>
					</div>
				</div>
			</section>

			<section className='py-16 px-6 max-w-7xl mx-auto'>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
					{features.map((feature, index) => (
						<div
							key={index}
							className='bg-zinc-900 border border-violet-900/20 rounded-xl p-6 hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10'
						>
							<div className='mb-4'>{feature.icon}</div>
							<h3 className='text-xl font-semibold text-white mb-3'>
								{feature.title}
							</h3>
							<p className='text-gray-400 leading-relaxed'>
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
