import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MAX_PATTERN_LENGTH, decodePattern } from './morse-decoder';
import { MORSE_TABLE, lookupPattern } from './morse-table';
import { anyString, specialAction, unknownDotDash } from './morse-test-arbitraries';
import { SPECIAL_CODE_TABLE, lookupAction } from './special-codes';

describe('decodePattern: special codes', () => {
  it('decodes ..-- to space', () => {
    expect(decodePattern('..--')).toEqual({ kind: 'action', action: 'space' });
  });

  it('decodes .-.- to confirm', () => {
    expect(decodePattern('.-.-')).toEqual({ kind: 'action', action: 'confirm' });
  });

  it('decodes ---- to undo', () => {
    expect(decodePattern('----')).toEqual({ kind: 'action', action: 'undo' });
  });

  it('decodes ...---... to sos', () => {
    expect(decodePattern('...---...')).toEqual({ kind: 'action', action: 'sos' });
  });

  it('decodes ... to the character S, not an action', () => {
    expect(decodePattern('...')).toEqual({ kind: 'character', character: 'S' });
  });
});

describe('decodePattern: tables', () => {
  it('decodes every one of the 39 table patterns to its character', () => {
    expect(MORSE_TABLE.size).toBe(39);
    for (const [character, pattern] of MORSE_TABLE) {
      expect(decodePattern(pattern)).toEqual({ kind: 'character', character });
    }
  });

  it('decodes the 4 special patterns to their actions', () => {
    expect(SPECIAL_CODE_TABLE.size).toBe(4);
    for (const [action, pattern] of SPECIAL_CODE_TABLE) {
      expect(decodePattern(pattern)).toEqual({ kind: 'action', action });
    }
  });
});

describe('decodePattern: invalid input', () => {
  it('treats the empty string as invalid and carries ""', () => {
    expect(decodePattern('')).toEqual({ kind: 'invalid', pattern: '' });
  });

  it('handles a 1,000-character dot string without throwing', () => {
    const input = '.'.repeat(MAX_PATTERN_LENGTH);
    expect(() => decodePattern(input)).not.toThrow();
    expect(decodePattern(input)).toEqual({ kind: 'invalid', pattern: input });
  });

  it('treats a 1,001-character dot string as invalid', () => {
    const input = '.'.repeat(MAX_PATTERN_LENGTH + 1);
    expect(decodePattern(input)).toEqual({ kind: 'invalid', pattern: input });
  });

  it.each([
    ['a space inside', '. -'],
    ['a leading space', ' .-'],
    ['a letter', '.-A'],
    ['a lowercase letter', 'a'],
    ['a digit', '.-1'],
    ['non-ASCII characters', '.–é'],
    ['an emoji', '.👻'],
  ])('treats a string with %s as invalid and carries the exact input', (_label, input) => {
    expect(decodePattern(input)).toEqual({ kind: 'invalid', pattern: input });
  });
});

describe('decodePattern: special codes property', () => {
  // Feature: morse-core, Property 2: Special codes never decode as characters
  // Validates: Requirements 2.4, 2.5, 3.2
  it('decodes each special pattern to its action and never a character', () => {
    fc.assert(
      fc.property(specialAction, (action) => {
        const pattern = SPECIAL_CODE_TABLE.get(action);
        expect(pattern).toBeDefined();
        const result = decodePattern(pattern ?? '');
        expect(result.kind).not.toBe('character');
        expect(result).toEqual({ kind: 'action', action });
      }),
      { numRuns: 100 },
    );
  });

  // Feature: morse-core, Property 2: Special codes never decode as characters
  // Validates: Requirements 2.4, 2.5, 3.2
  it('never decodes a non-empty proper prefix of a special pattern as an action', () => {
    fc.assert(
      fc.property(specialAction, fc.nat(), (action, n) => {
        const pattern = SPECIAL_CODE_TABLE.get(action) ?? '';
        const length = 1 + (n % (pattern.length - 1));
        const result = decodePattern(pattern.slice(0, length));
        expect(result.kind).not.toBe('action');
      }),
      { numRuns: 100 },
    );
  });
});

describe('decodePattern: unknown patterns property', () => {
  const notInEitherTable = anyString.filter(
    (s) => lookupPattern(s) === undefined && lookupAction(s) === undefined,
  );
  const longUnknown = fc
    .array(fc.constantFrom('.', '-'), { minLength: 1001, maxLength: 1200 })
    .map((s) => s.join(''));
  const unknownInput = fc.oneof(
    unknownDotDash,
    notInEitherTable,
    fc.string({ unit: 'binary', maxLength: 20 }).filter((s) => !/^[.-]*$/.test(s)),
    longUnknown,
    fc.constant(''),
  );

  // Feature: morse-core, Property 3: Unknown patterns are invalid and safe
  // Validates: Requirements 1.7, 2.6, 3.3, 3.4, 3.5
  it('returns invalid with the exact input and never throws', () => {
    fc.assert(
      fc.property(unknownInput, (input) => {
        expect(lookupPattern(input)).toBeUndefined();
        expect(lookupAction(input)).toBeUndefined();
        let result: ReturnType<typeof decodePattern> | undefined;
        expect(() => {
          result = decodePattern(input);
        }).not.toThrow();
        expect(result).toEqual({ kind: 'invalid', pattern: input });
      }),
      { numRuns: 200 },
    );
  });
});

describe('decodePattern: result kind and determinism property', () => {
  const tablePatterns = new Set<string>(MORSE_TABLE.values());
  const specialPatterns = new Set<string>(SPECIAL_CODE_TABLE.values());

  // Feature: morse-core, Property 4: Decoder result kind matches table membership and is deterministic
  // Validates: Requirements 3.6, 3.7
  it('returns a kind that matches table membership, twice the same, leaving tables unchanged', () => {
    const morseBefore = JSON.stringify([...MORSE_TABLE]);
    const specialBefore = JSON.stringify([...SPECIAL_CODE_TABLE]);

    const input = fc.oneof(
      fc.constantFrom(...MORSE_TABLE.values()),
      fc.constantFrom(...SPECIAL_CODE_TABLE.values()),
      anyString,
    );
    const seen = { character: 0, action: 0, invalid: 0 };

    fc.assert(
      fc.property(input, (s) => {
        const first = decodePattern(s);
        const second = decodePattern(s);
        seen[first.kind] += 1;

        expect(second).toEqual(first);
        expect(first.kind === 'character').toBe(tablePatterns.has(s));
        expect(first.kind === 'action').toBe(specialPatterns.has(s));
        expect(first.kind === 'invalid').toBe(!tablePatterns.has(s) && !specialPatterns.has(s));

        expect(JSON.stringify([...MORSE_TABLE])).toBe(morseBefore);
        expect(JSON.stringify([...SPECIAL_CODE_TABLE])).toBe(specialBefore);
      }),
      { numRuns: 200 },
    );

    expect(seen.character).toBeGreaterThan(0);
    expect(seen.action).toBeGreaterThan(0);
    expect(seen.invalid).toBeGreaterThan(0);
  });
});
