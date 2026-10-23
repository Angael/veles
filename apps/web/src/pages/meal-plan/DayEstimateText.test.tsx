import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { DayEstimateText } from './DayEstimateText';

function render(estimate: Parameters<typeof DayEstimateText>[0]['estimate']) {
  return renderToStaticMarkup(
    <I18nProvider locale='en'>
      <DayEstimateText estimate={estimate} />
    </I18nProvider>,
  );
}

describe('DayEstimateText', () => {
  it('labels a complete total as an estimate', () => {
    expect(render({ kcal: 1500.4, estimatedCount: 2, missingCount: 0 })).toContain(
      '≈ 1,500 kcal planned',
    );
  });

  it('labels a partial total as a lower bound and counts the meals it leaves out', () => {
    const markup = render({ kcal: 750, estimatedCount: 1, missingCount: 2 });
    expect(markup).toContain('≥ 750 kcal planned');
    expect(markup).toContain('2 meals without nutrition');
  });

  it('shows no number when no meal has nutrition', () => {
    const markup = render({ kcal: 0, estimatedCount: 0, missingCount: 1 });
    expect(markup).toContain('No kcal estimate');
    expect(markup).not.toContain('0 kcal');
  });
});
