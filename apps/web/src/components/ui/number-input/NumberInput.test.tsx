import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NumberInput } from './NumberInput';

describe('NumberInput', () => {
  it('allows hundredth precision without native step validation', () => {
    const markup = renderToStaticMarkup(<NumberInput defaultValue={365.38} min={0} />);

    expect(markup).toContain('step="any"');
    expect(markup).toContain('value="365.38"');
  });
});
