import { lookupPattern } from './morse-table';
import type { DecodeResult } from './morse-types';
import { lookupAction } from './special-codes';

export const MAX_PATTERN_LENGTH = 1000;

const DOT_DASH_ONLY = /^[.-]+$/;

/**
 * Turns a finished Morse pattern into a character, a special action, or an
 * invalid result that carries the exact input. Never throws.
 */
export function decodePattern(pattern: string): DecodeResult {
  if (pattern.length > MAX_PATTERN_LENGTH || !DOT_DASH_ONLY.test(pattern)) {
    return { kind: 'invalid', pattern };
  }

  const action = lookupAction(pattern);
  if (action !== undefined) {
    return { kind: 'action', action };
  }

  const character = lookupPattern(pattern);
  if (character !== undefined) {
    return { kind: 'character', character };
  }

  return { kind: 'invalid', pattern };
}
