import { describe, expect, it } from 'vitest';
import { dropLocationFrom } from './drop-target';

describe('dropLocationFrom', () => {
  it('finds the location of a tab and of an element inside it', () => {
    document.body.innerHTML =
      '<button data-drop-location="pantry"><span id="in">Vorrat</span></button><p id="out">x</p>';
    expect(dropLocationFrom(document.getElementById('in'))).toBe('pantry');
    expect(dropLocationFrom(document.querySelector('button'))).toBe('pantry');
  });

  it('is null outside the tabs, for nothing and for unknown values', () => {
    document.body.innerHTML = '<p id="out">x</p><i data-drop-location="cellar"></i>';
    expect(dropLocationFrom(document.getElementById('out'))).toBeNull();
    expect(dropLocationFrom(document.querySelector('i'))).toBeNull();
    expect(dropLocationFrom(null)).toBeNull();
  });
});
