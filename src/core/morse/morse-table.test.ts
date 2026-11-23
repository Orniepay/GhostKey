import { describe, expect, it } from 'vitest';
import {
  MORSE_CHARACTERS,
  MORSE_TABLE,
  isSupportedCharacter,
  lookupCharacter,
  lookupPattern,
} from './morse-table';
import type { SupportedCharacter } from './morse-table';

// Literal copy of the supported characters in .kiro/steering/morse-rules.md.
const EXPECTED_CHARACTERS: readonly string[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
  '.', ',', '?',
];

// Literal copy of the code table in .kiro/steering/morse-rules.md.
const EXPECTED_PATTERNS: Readonly<Record<string, string>> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
  H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
  O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-',
  V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
  '.': '.-.-.-', ',': '--..--', '?': '..--..',
};

const BAD_INPUTS: readonly string[] = ['1x', '', '__proto__', 'constructor'];

describe('MORSE_CHARACTERS', () => {
  it('has 39 entries', () => {
    expect(MORSE_CHARACTERS).toHaveLength(39);
  });

  it('has no duplicates', () => {
    expect(new Set(MORSE_CHARACTERS).size).toBe(39);
  });

  it('matches the morse-rules.md list in order', () => {
    expect([...MORSE_CHARACTERS]).toEqual(EXPECTED_CHARACTERS);
  });
});

describe('MORSE_TABLE patterns', () => {
  it('has 39 entries in table order', () => {
    expect([...MORSE_TABLE.keys()]).toEqual(EXPECTED_CHARACTERS);
  });

  it('equals the morse-rules.md table', () => {
    for (const character of MORSE_CHARACTERS) {
      expect(MORSE_TABLE.get(character)).toBe(EXPECTED_PATTERNS[character]);
    }
  });

  it('has distinct patterns', () => {
    expect(new Set(MORSE_TABLE.values()).size).toBe(39);
  });

  it('uses only dots and dashes, with length 1 to 6', () => {
    for (const pattern of MORSE_TABLE.values()) {
      expect(pattern).toMatch(/^[.-]{1,6}$/);
    }
  });

  it('round-trips through both lookups', () => {
    for (const character of MORSE_CHARACTERS) {
      const pattern = lookupCharacter(character);
      expect(pattern).toBe(EXPECTED_PATTERNS[character]);
      expect(pattern === undefined ? undefined : lookupPattern(pattern)).toBe(character);
    }
  });
});

describe('failed lookups', () => {
  it.each(BAD_INPUTS)('lookupPattern(%j) returns undefined without throwing', (input) => {
    expect(() => lookupPattern(input)).not.toThrow();
    expect(lookupPattern(input)).toBeUndefined();
  });

  it.each(BAD_INPUTS)('lookupCharacter(%j) returns undefined without throwing', (input) => {
    expect(() => lookupCharacter(input)).not.toThrow();
    expect(lookupCharacter(input)).toBeUndefined();
  });

  it('leaves the table unchanged', () => {
    const before = [...MORSE_TABLE.entries()];
    const charactersBefore = [...MORSE_CHARACTERS];
    for (const input of BAD_INPUTS) {
      lookupPattern(input);
      lookupCharacter(input);
    }
    expect([...MORSE_TABLE.entries()]).toEqual(before);
    expect([...MORSE_CHARACTERS]).toEqual(charactersBefore);
  });
});

describe('compile-time checks', () => {
  it('rejects a lowercase letter as a SupportedCharacter at compile time', () => {
    // @ts-expect-error 'a' is not in the MORSE_CHARACTERS union
    const c: SupportedCharacter = 'a';
    expect(isSupportedCharacter(c)).toBe(false);
  });
});
