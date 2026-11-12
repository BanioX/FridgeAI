import { describe, expect, it } from 'vitest';
import { dropKey, dropTargetFrom, sameTarget } from './drop-target';

describe('dropTargetFrom', () => {
  it('finds a tab and an element inside it', () => {
    document.body.innerHTML =
      '<button data-drop-target="location:pantry"><span id="in">Vorrat</span></button><p id="out">x</p>';
    expect(dropTargetFrom(document.getElementById('in'))).toEqual({
      kind: 'location',
      location: 'pantry',
    });
    expect(dropTargetFrom(document.querySelector('button'))).toEqual({
      kind: 'location',
      location: 'pantry',
    });
  });

  it('finds a pot', () => {
    document.body.innerHTML = '<button data-drop-target="action:wasted"><i id="in"></i></button>';
    expect(dropTargetFrom(document.getElementById('in'))).toEqual({
      kind: 'action',
      action: 'wasted',
    });
  });

  it('is null outside the targets, for nothing and for unknown values', () => {
    document.body.innerHTML =
      '<p id="out">x</p><i data-drop-target="location:cellar"></i><b data-drop-target="action:bake"></b><u data-drop-target="fridge"></u><s data-drop-target="action:eaten:x"></s>';
    expect(dropTargetFrom(document.getElementById('out'))).toBeNull();
    for (const tag of ['i', 'b', 'u', 's']) {
      expect(dropTargetFrom(document.querySelector(tag))).toBeNull();
    }
    expect(dropTargetFrom(null)).toBeNull();
  });
});

describe('dropKey and sameTarget', () => {
  it('names a target like its attribute and compares by it', () => {
    expect(dropKey({ kind: 'location', location: 'fridge' })).toBe('location:fridge');
    expect(dropKey({ kind: 'action', action: 'rebuy' })).toBe('action:rebuy');
    expect(
      sameTarget({ kind: 'action', action: 'eaten' }, { kind: 'action', action: 'eaten' }),
    ).toBe(true);
    expect(
      sameTarget({ kind: 'action', action: 'eaten' }, { kind: 'location', location: 'fridge' }),
    ).toBe(false);
    expect(sameTarget(null, { kind: 'action', action: 'eaten' })).toBe(false);
  });
});
