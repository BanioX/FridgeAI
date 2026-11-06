import { describe, expect, it } from 'vitest';

import { CONTRACT_VERSION } from '../src/index';

describe('core package', () => {
  it('exposes the contract version', () => {
    expect(CONTRACT_VERSION).toBe('v1');
  });
});
