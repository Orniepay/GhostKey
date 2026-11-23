import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decodePattern } from './morse-decoder';
import { encodeCharacter } from './morse-encoder';
import { MORSE_CHARACTERS, MORSE_TABLE } from './morse-table';
import { lowercaseLetter, supportedCharacter } from './morse-test-arbitraries';

describe('encodeCharacter', () => {
  it('encodes "a" and "A" to ".-"', () => {
    expect(encodeCharacter('a')).toEqual({ kind: 'found', pattern: '.-' });
    expect(encodeCharacter('A')).toEqual({ kind: 'found', pattern: '.-' });
  });

  it.each(['', 'AB', ' ', '!', 'é', 'ß', 'ı', 'ſ', '😀'])(
    'returns not-found with no pattern for %j',
    (input) => {
      const result = encodeCharacter(input);
      expect(result.kind).toBe('not-found');
      expect('pattern' in result).toBe(false);
    },
  );

  it('encodes all 39 supported characters to a non-empty dot-dash pattern', () => {
    expect(MORSE_CHARACTERS).toHaveLength(39);
    for (const character of MORSE_CHARACTERS) {
      const result = encodeCharacter(character);
      expect(result.kind).toBe('found');
      if (result.kind === 'found') {
        expect(result.pattern).toMatch(/^[.-]+$/);
      }
    }
  });
});

describe('encode then decode round trip', () => {
  // Feature: morse-core, Property 1: Encode then decode round trip
  // Validates: Requirements 3.1, 3.8, 4.1, 4.2, 4.4, 4.5
  it('decodes the encoded pattern of any supported character back to it', () => {
    fc.assert(
      fc.property(supportedCharacter, (c) => {
        const encoded = encodeCharacter(c);
        expect(encoded.kind).toBe('found');
        if (encoded.kind !== 'found') return;
        expect(decodePattern(encoded.pattern)).toEqual({ kind: 'character', character: c });
      }),
      { numRuns: 100 },
    );
  });

  // Feature: morse-core, Property 1: Encode then decode round trip
  // Validates: Requirements 3.1, 3.8, 4.1, 4.2, 4.4, 4.5
  it('encodes a lowercase letter like its uppercase letter and decodes to uppercase', () => {
    fc.assert(
      fc.property(lowercaseLetter, (l) => {
        const upper = l.toUpperCase();
        const encoded = encodeCharacter(l);
        expect(encoded).toEqual(encodeCharacter(upper));
        expect(encoded.kind).toBe('found');
        if (encoded.kind !== 'found') return;
        expect(decodePattern(encoded.pattern)).toEqual({ kind: 'character', character: upper });
      }),
      { numRuns: 100 },
    );
  });
});

describe('encoder totality', () => {
  // Feature: morse-core, Property 5: Encoder is total and rejects non-characters
  // Validates: Requirements 1.6, 4.3, 4.6
  it('never throws, and rejects anything that is not exactly one supported character', () => {
    const supported = new Set<string>(MORSE_CHARACTERS);
    const before = JSON.stringify([...MORSE_TABLE.entries()]);
    // Every input is 0 to 100 characters long.
    const input = fc.oneof(
      fc.string({ unit: 'binary', maxLength: 100 }),
      fc.array(fc.constantFrom('.', '-'), { maxLength: 100 }).map((a) => a.join('')),
      supportedCharacter,
      lowercaseLetter,
      fc.constantFrom('ı', 'ſ', 'ß', 'é', '😀'),
    );
    fc.assert(
      fc.property(input, (s) => {
        const result = encodeCharacter(s);
        expect(['found', 'not-found']).toContain(result.kind);
        const upper = /^[a-z]$/.test(s) ? s.toUpperCase() : s;
        if (!supported.has(upper)) {
          expect(result.kind).toBe('not-found');
          expect('pattern' in result).toBe(false);
        }
        expect(JSON.stringify([...MORSE_TABLE.entries()])).toBe(before);
      }),
      { numRuns: 200 },
    );
  });
});