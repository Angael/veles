import { useEffect, useState } from 'react';

type Breakpoint = { min: number; cols: number };

const DEFAULT_BREAKPOINTS: Breakpoint[] = [
	{ min: 1280, cols: 6 }, // xl
	{ min: 1024, cols: 5 }, // lg
	{ min: 768, cols: 4 }, // md
	{ min: 640, cols: 3 }, // sm
	{ min: 0, cols: 2 }, // default
];

/**
 * Returns the number of grid columns based on current viewport width.
 * Breakpoints match Tailwind's responsive prefixes by default.
 */
export function useResponsiveColumns(breakpoints = DEFAULT_BREAKPOINTS) {
	const [columns, setColumns] = useState(
		breakpoints[breakpoints.length - 1].cols,
	);

	useEffect(() => {
		const updateColumns = () => {
			const width = window.innerWidth;
			for (const bp of breakpoints) {
				if (width >= bp.min) {
					setColumns(bp.cols);
					return;
				}
			}
		};

		updateColumns();
		window.addEventListener('resize', updateColumns);
		return () => window.removeEventListener('resize', updateColumns);
	}, [breakpoints]);

	return columns;
}
