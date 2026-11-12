import { describe, expect, it } from 'vitest';
import { initialsOf } from '../src';

describe('initialsOf', () => {
  it('takes the first letters of the first two words, uppercase', () => {
    expect(initialsOf('Mia Muster')).toBe('MM');
    expect(initialsOf('noah de la Cruz')).toBe('ND');
  });

  it('uses one letter for a one-word name', () => {
    expect(initialsOf('Noah')).toBe('N');
  });

  it('handles umlauts and extra spaces', () => {
    expect(initialsOf('  Änne  Özdemir ')).toBe('ÄÖ');
    expect(initialsOf('élodie')).toBe('É');
  });

  it('keeps the base letters when nobody else has them', () => {
    expect(initialsOf('Mia', ['Noah', 'Max Muster'])).toBe('M');
  });

  it('uses two letters of the first name when initials collide', () => {
    expect(initialsOf('Mia', ['Max'])).toBe('Mi');
    expect(initialsOf('Max', ['Mia'])).toBe('Ma');
    expect(initialsOf('Mia Muster', ['Max Meier'])).toBe('Mi');
  });

  it('keeps a one-letter name when it cannot be made longer', () => {
    expect(initialsOf('M', ['Mia'])).toBe('M');
  });
});
