import { describe, expect, it } from 'vitest';
import { cancelsSelectionOnBack } from './useCancelSelectionOnBack';

describe('cancelsSelectionOnBack', () => {
  it('consumes Back while logs are selected', () => {
    expect(cancelsSelectionOnBack('BACK', true)).toBe(true);
  });

  it('lets Back navigate once the selection is cleared', () => {
    expect(cancelsSelectionOnBack('BACK', false)).toBe(false);
  });

  it('never blocks other navigation during a selection', () => {
    for (const action of ['PUSH', 'REPLACE', 'FORWARD', 'GO']) {
      expect(cancelsSelectionOnBack(action, true)).toBe(false);
    }
  });
});
