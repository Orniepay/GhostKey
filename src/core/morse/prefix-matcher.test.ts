import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MORSE_CHARACTERS, MORSE_TABLE } from './morse-table';
import { dotDashString } from './morse-test-arbitraries';
import type { MatchEntry } from './morse-types';
import { matchingCharacters } from './prefix-matcher';
import { SPECIAL_ACTIONS, SPECIAL_CODE_TABLE } from './special-codes';

function label(entry: MatchEntry): string {
  return entry.kind === 'character' ? entry.character : entry.action;
}

describe('matchingCharacters', () => {
  it('returns 43 entries in fixed order for the empty prefix', () => {
    const result = matchingCharacters('');
    expect(result).toHaveLength(43);
    expect(result.map(label)).toEqual([...MORSE_CHARACTERS, ...SPECIAL_ACTIONS]);
    expect(result.slice(0, 39).every((entry) => entry.kind === 'character')).toBe(true);
    expect(result.slice(39).every((entry) => entry.kind === 'action')).toBe(true);
  });

  it('returns exactly A, R, W, L, P, J, 1, period and confirm for ".-"', () => {
    const labels = matchingCharacters('.-').map(label);
    expect([...labels].sort()).toEqual(
      ['A', 'R', 'W', 'L', 'P', 'J', '1', '.', 'confirm'].sort(),
    );
    // Table order: characters first in table order, then actions.
    expect(labels).toEqual(['A', 'J', 'L', 'P', 'R', 'W', '1', '.', 'confirm']);
  });

  it('returns S and every longer pattern that starts with it for "..."', () => {
    const result = matchingCharacters('...');
    const expected = matchingCharacters('').filter((entry) => entry.pattern.startsWith('...'));
    expect(result).toEqual(expected);
    const labels = result.map(label);
    expect(labels).toContain('S');
    expect(labels).toContain('H');
    expect(labels).toContain('V');
    expect(labels).toContain('3');
    expect(labels).toContain('4');
    expect(labels).toContain('5');
    expect(labels).toContain('sos');
    expect(labels).not.toContain('I');
    expect(labels).not.toContain('U');
    expect(result.every((entry) => entry.pattern.length >= 3)).toBe(true);
  });

  it('returns [] for a 9-dot prefix', () => {
    expect(matchingCharacters('.........')).toEqual([]);
  });

  it('returns [] without throwing for a prefix with a space or a letter', () => {
    for (const prefix of ['. -', ' ', '.-x', 'A', 'a', '.\n']) {
      expect(() => matchingCharacters(prefix)).not.toThrow();
      expect(matchingCharacters(prefix)).toEqual([]);
    }
  });

  it('is not affected by changes to a returned array', () => {
    const first = matchingCharacters('.-') as MatchEntry[];
    const before = first.map(label);
    first.length = 0;
    const second = matchingCharacters('.-');
    expect(second.map(label)).toEqual(before);

    const all = matchingCharacters('') as MatchEntry[];
    all.pop();
    expect(matchingCharacters('')).toHaveLength(43);
  });
});

describe('matchingCharacters properties', () => {
  // Feature: morse-core, Property 6: Prefix matcher equals the model filter
  // Validates: Requirements 5.1, 5.3, 5.5, 5.7, 5.9
  it('equals the ordered model list filtered by startsWith', () => {
    // Model: 39 characters in table order, then space, confirm, undo, sos.
    const model: { name: string; pattern: string }[] = [];
    for (const character of MORSE_CHARACTERS) {
      model.push({ name: character, pattern: MORSE_TABLE.get(character) ?? '' });
    }
    for (const action of SPECIAL_ACTIONS) {
      model.push({ name: action, pattern: SPECIAL_CODE_TABLE.get(action) ?? '' });
    }
    expect(model).toHaveLength(43);
    expect(model.every((m) => m.pattern !== '')).toBe(true);

    fc.assert(
      fc.property(dotDashString, (prefix) => {
        const result = matchingCharacters(prefix);
        const expected = model.filter((m) => m.pattern.startsWith(prefix));
        expect(result.map((e) => ({ name: label(e), pattern: e.pattern }))).toEqual(expected);
        expect(result.every((e) => e.pattern.startsWith(prefix))).toBe(true);
        const names = result.map(label);
        expect(new Set(names).size).toBe(names.length);
        // Fixed order: same relative order as the model.
        const order = names.map((n) => model.findIndex((m) => m.name === n));
        expect(order).toEqual([...order].sort((a, b) => a - b));
      }),
      { numRuns: 200 },
    );
  });
});

describe('matchingCharacters narrowing property', () => {
  // Feature: morse-core, Property 7: Extending a prefix only narrows the result
  // Validates: Requirements 5.8
  it('every entry matching p + c also matches p', () => {
    fc.assert(
      fc.property(dotDashString, fc.constantFrom('.', '-'), (prefix, next) => {
        const wider = matchingCharacters(prefix).map(label);
        const narrower = matchingCharacters(prefix + next).map(label);
        for (const name of narrower) {
          expect(wider).toContain(name);
        }
        expect(narrower.length).toBeLessThanOrEqual(wider.length);
      }),
      { numRuns: 200 },
    );
  });
});

describe('matchingCharacters non-dot-dash property', () => {
  // Feature: morse-core, Property 8: Prefixes with other characters match nothing
  // Validates: Requirements 5.6
  it('returns an empty list without throwing when the prefix has another character', () => {
    const otherChar = fc.oneof(
      fc.string({ unit: 'binary', minLength: 1, maxLength: 1 }).filter((c) => c !== '.' && c !== '-'),
      fc.constantFrom('😀', '\u0000', 'é', '\n', '\u{1F47B}', '\u200B'),
    );
    const prefixWithOther = fc
      .tuple(dotDashString, otherChar, dotDashString)
      .map(([before, other, after]) => before + other + after);
    const anyStringWithOther = fc
      .string({ unit: 'binary', maxLength: 20 })
      .filter((s) => [...s].some((c) => c !== '.' && c !== '-'));

    fc.assert(
      fc.property(fc.oneof(prefixWithOther, anyStringWithOther), (prefix) => {
        expect(() => matchingCharacters(prefix)).not.toThrow();
        expect(matchingCharacters(prefix)).toEqual([]);
      }),
      { numRuns: 200 },
    );
  });
});
