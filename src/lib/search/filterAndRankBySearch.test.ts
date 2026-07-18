import { describe, expect, it } from 'vitest';
import { filterAndRankBySearch, type RankedSearchFields } from './filterAndRankBySearch';

type Item = {
  description: string;
  id: number;
  name: string;
  tags: string[];
};

const fields = [
  (item) => item.name,
  (item) => item.tags,
  (item) => item.description,
] satisfies RankedSearchFields<Item>;

describe('filterAndRankBySearch', () => {
  it('returns the original items for a blank search', () => {
    const items: Item[] = [
      { description: '', id: 1, name: 'First', tags: [] },
      { description: '', id: 2, name: 'Second', tags: [] },
    ];

    expect(filterAndRankBySearch(items, '  ', fields)).toBe(items);
  });

  it('normalizes the search and ranks fields by priority', () => {
    const items: Item[] = [
      { description: 'Fresh APPLES', id: 1, name: 'Pie', tags: [] },
      { description: '', id: 2, name: 'Crumble', tags: ['apple'] },
      { description: '', id: 3, name: 'Apple tart', tags: [] },
    ];

    expect(filterAndRankBySearch(items, ' APPLE ', fields).map((item) => item.id)).toEqual([
      3, 2, 1,
    ]);
  });

  it('keeps source order within a rank and includes an item only at its highest rank', () => {
    const items: Item[] = [
      { description: 'soup', id: 1, name: 'First soup', tags: ['soup'] },
      { description: '', id: 2, name: 'Second soup', tags: [] },
      { description: '', id: 3, name: 'Other', tags: ['soup'] },
      { description: '', id: 4, name: 'No match', tags: [] },
    ];

    expect(filterAndRankBySearch(items, 'soup', fields).map((item) => item.id)).toEqual([1, 2, 3]);
    expect(items.map((item) => item.id)).toEqual([1, 2, 3, 4]);
  });

  it('matches canonically equivalent Unicode without mutating candidate fields', () => {
    const tags = ['Cafe\u0301'];
    const items: Item[] = [{ description: '', id: 1, name: 'Other', tags }];

    expect(filterAndRankBySearch(items, 'Café', fields).map((item) => item.id)).toEqual([1]);
    expect(tags).toEqual(['Cafe\u0301']);
  });

  it('returns no items when no field matches', () => {
    const items: Item[] = [{ description: '', id: 1, name: 'Pie', tags: [] }];
    expect(filterAndRankBySearch(items, 'soup', fields)).toEqual([]);
  });
});
