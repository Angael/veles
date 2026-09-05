import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FoodEditor } from './FoodEditor';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

describe('FoodEditor', () => {
  it('renders every field required by create submission', () => {
    const markup = renderToStaticMarkup(
      <FoodEditor
        initialName='Scanned product'
        onSubmit={vi.fn()}
        pending={false}
        submitLabel='Create food'
      />,
    );

    expect(markup).toContain('name="name"');
    expect(markup).toContain('name="brand"');
  });
});
