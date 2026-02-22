import { describe, it } from 'vitest';
import fc from 'fast-check';

describe('Fast-check Setup', () => {
  it('should run property-based tests', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a; // Commutative property of addition
      }),
      { numRuns: 100 }
    );
  });

  it('should generate strings', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        return str.length >= 0; // All strings have non-negative length
      }),
      { numRuns: 100 }
    );
  });
});
