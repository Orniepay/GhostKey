import { lookupCharacter } from './morse-table';
import type { EncodeResult } from './morse-types';

const NOT_FOUND: EncodeResult = { kind: 'not-found' };

/** Uppercases only a to z. Other characters, including Unicode, are unchanged. */
function uppercaseAsciiLetter(char: string): string {
  if (char >= 'a' && char <= 'z') {
    return String.fromCharCode(char.charCodeAt(0) - 32);
  }
  return char;
}

/**
 * Returns the Morse pattern for a single supported character.
 * Lowercase a to z is treated as uppercase. Anything else, including empty
 * or multi-character input, gives not-found. Never throws.
 */
export function encodeCharacter(input: string): EncodeResult {
  if (input.length !== 1) {
    return NOT_FOUND;
  }
  const pattern = lookupCharacter(uppercaseAsciiLetter(input));
  if (pattern === undefined) {
    return NOT_FOUND;
  }
  return { kind: 'found', pattern };
}
