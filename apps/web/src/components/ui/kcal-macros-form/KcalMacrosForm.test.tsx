import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { KcalMacrosForm } from './KcalMacrosForm';

describe('KcalMacrosForm', () => {
  it('lets callers make calories optional', () => {
    const requiredMarkup = renderToStaticMarkup(<KcalMacrosForm />);
    const optionalMarkup = renderToStaticMarkup(<KcalMacrosForm kcalRequired={false} />);

    expect(requiredMarkup).toContain('required=""');
    expect(optionalMarkup).not.toContain('required=""');
  });
});
