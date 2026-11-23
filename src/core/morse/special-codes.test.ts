import { describe, expect, it } from 'vitest';
import { MORSE_TABLE } from './morse-table';
import {
  SPECIAL_ACTIONS,
  SPECIAL_CODE_TABLE,
  lookupAction,
} from './special-codes';

describe('SPECIAL_ACTIONS', () => {
  it('lists space, confirm, undo, sos in that order', () => {
    expect([...SPECIAL_ACTIONS]).toEqual(['space', 'confirm', 'undo', 'sos']);
  });
});

describe('SPECIAL_CODE_TABLE', () => {
  it('has exactly 4 entries with the correct patterns, in order', () => {
    expect(SPECIAL_CODE_TABLE.size).toBe(4);
    expect([...SPECIAL_CODE_TABLE.entries()]).toEqual([
      ['space', '..--'],
      ['confirm', '.-.-'],
      ['undo', '----'],
      ['sos', '...---...'],
    ]);
  });

  it('has 4 distinct patterns', () => {
    const patterns = [...SPECIAL_CODE_TABLE.values()];
    expect(new Set(patterns).size).toBe(4);
  });

  it('uses no pattern that a supported character uses', () => {
    const characterPatterns = new Set(MORSE_TABLE.values());
    for (const pattern of SPECIAL_CODE_TABLE.values()) {
      expect(characterPatterns.has(pattern)).toBe(false);
    }
  });
});

describe('lookupAction', () => {
  it('returns the action for each special pattern', () => {
    expect(lookupAction('..--')).toBe('space');
    expect(lookupAction('.-.-')).toBe('confirm');
    expect(lookupAction('----')).toBe('undo');
    expect(lookupAction('...---...')).toBe('sos');
  });

  it.each(['.-', '...', '1x', '', '__proto__', 'constructor'])(
    'returns undefined for %j without throwing',
    (input) => {
      expect(() => lookupAction(input)).not.toThrow();
      expect(lookupAction(input)).toBeUndefined();
    },
  );

  it('leaves the table unchanged after failed lookups', () => {
    const before = [...SPECIAL_CODE_TABLE.entries()];
    lookupAction('__proto__');
    lookupAction('');
    expect([...SPECIAL_CODE_TABLE.entries()]).toEqual(before);
  });
});
