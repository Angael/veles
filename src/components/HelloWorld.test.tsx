import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HelloWorld from './HelloWorld';

describe('HelloWorld', () => {
	it('should display Hello World text', () => {
		render(<HelloWorld />);

		expect(screen.getByText('Hello World')).toBeDefined();
	});
});
