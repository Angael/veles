const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** Truncates visible text without splitting surrogate pairs or combining sequences. */
export function takeGraphemes(value: string, maximum: number) {
  const graphemeCount = Number.isFinite(maximum) ? Math.max(0, Math.floor(maximum)) : 0;
  const segments = graphemeSegmenter.segment(value);
  let result = '';
  let count = 0;

  for (const segment of segments) {
    if (count >= graphemeCount) {
      break;
    }

    result += segment.segment;
    count += 1;
  }

  return result;
}
