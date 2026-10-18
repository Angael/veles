import type { Measure } from '../metrics';
import { normalize } from './fuzzySearch';

/** Loaded or machine variants of bodyweight moves are logged with weight. */
const WEIGHTED = /machine|maszyn|obciaz|sztang|hantl|hantel|kettl|wyciag/;

const RULES: { measure: Measure; pattern: RegExp }[] = [
  // Before distance: "spacer farmera" is a walk, but a loaded one.
  {
    measure: 'weight_duration',
    pattern: /farmer|carry|weighted (hang|hold|plank)|noszenie|walizk/,
  },
  {
    measure: 'distance_duration',
    pattern:
      /\b(run|bike|cycl|swim|walk|km)|row(ing|er)\b|\b(bieg|rower|plywa|marsz|spacer|wioslarz|ergometr|orbitrek|nordic)/,
  },
  {
    measure: 'duration',
    pattern:
      /plank|\bhold|\bhang|stretch|wall sit|l-sit|\bdeska|\bwis\b|zwis|rozciag|krzeselko|skakank/,
  },
  {
    measure: 'reps',
    pattern:
      /push-?up|pull-?up|chin-?up|\bdip|burpee|sit-?up|crunch|pompk|podciag|brzuszk|spiecia|pajacyk|unoszenie nog/,
  },
];

/**
 * Guesses what to track from a user's own name, in English or Polish, so creating "Pompki" or
 * "Morning plank" needs zero extra taps. Anything unknown, such as "Przysiady", is weight × reps.
 */
export function guessMeasure(name: string): Measure {
  const text = normalize(name);
  const rule = RULES.find(({ measure, pattern }) => {
    if (!pattern.test(text)) return false;
    return !(measure === 'reps' || measure === 'duration') || !WEIGHTED.test(text);
  });
  return rule?.measure ?? 'weight_reps';
}
