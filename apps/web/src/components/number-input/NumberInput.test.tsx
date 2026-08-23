import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NumberInput } from './NumberInput';

describe('NumberInput', () => {
  it('allows fractional values by default', () => {
    const markup = renderToStaticMarkup(<NumberInput defaultValue={1.4} min={0} />);

    expect(markup).toContain('step="any"');
    expect(markup).toContain('value="1.4"');
  });
});
