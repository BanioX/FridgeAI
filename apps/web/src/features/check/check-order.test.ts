import type { InventoryItemView } from '@fridgeai/core';
import { describe, expect, it } from 'vitest';
import { groupBySpot, spotCue } from './check-order';

const SHELVES = ['Türfach', 'Oberes Fach', 'Mittleres Fach', 'Unteres Fach', 'Gemüsefach'];

const item = (name: string, spot: string | null) =>
  ({
    name,
    spot: spot === null ? null : { id: `spot-${spot}`, name: spot, hasPhoto: false },
  }) as unknown as InventoryItemView;

const names = (items: readonly InventoryItemView[]) => items.map((entry) => entry.name);

describe('groupBySpot', () => {
  it('puts fridge shelves in the fridge order, other spots by name, loose items last', () => {
    const queue = [
      item('A', null),
      item('B', 'Gemüsefach'),
      item('C', 'Zweites Regal'),
      item('D', 'Türfach'),
      item('E', 'Ärmel-Box'),
      item('F', 'Gemüsefach'),
    ];
    expect(names(groupBySpot(queue, SHELVES))).toEqual(['D', 'B', 'F', 'E', 'C', 'A']);
  });

  it('keeps the queue order within a spot and does not touch the input', () => {
    const queue = [item('A', 'Türfach'), item('B', null), item('C', 'Türfach')];
    expect(names(groupBySpot(queue, SHELVES))).toEqual(['A', 'C', 'B']);
    expect(names(queue)).toEqual(['A', 'B', 'C']);
  });

  it('leaves the order alone when nobody has a spot', () => {
    const queue = [item('B', null), item('A', null)];
    expect(names(groupBySpot(queue, SHELVES))).toEqual(['B', 'A']);
  });
});

describe('spotCue', () => {
  const queue = [
    item('A', 'Türfach'),
    item('B', 'Türfach'),
    item('C', 'Gemüsefach'),
    item('D', null),
  ];

  it('shows a cue on the first card and whenever the spot changes', () => {
    expect(spotCue(queue, 0)?.name).toBe('Türfach');
    expect(spotCue(queue, 1)).toBeUndefined();
    expect(spotCue(queue, 2)?.name).toBe('Gemüsefach');
    expect(spotCue(queue, 3)).toBeNull();
  });

  it('shows no cue at all when nobody has a spot', () => {
    expect(spotCue([item('A', null), item('B', null)], 0)).toBeUndefined();
  });

  it('has no cue past the end', () => {
    expect(spotCue(queue, 4)).toBeUndefined();
  });
});
