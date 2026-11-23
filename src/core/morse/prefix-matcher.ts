import { MORSE_CHARACTERS, MORSE_TABLE } from './morse-table';
import type { MatchEntry } from './morse-types';
import { SPECIAL_ACTIONS, SPECIAL_CODE_TABLE } from './special-codes';

const PREFIX_PATTERN = /^[.-]*$/;

function buildEntries(): readonly MatchEntry[] {
  const entries: MatchEntry[] = [];
  for (const character of MORSE_CHARACTERS) {
    const pattern = MORSE_TABLE.get(character);
    if (pattern !== undefined) {
      entries.push({ kind: 'character', character, pattern });
    }
  }
  for (const action of SPECIAL_ACTIONS) {
    const pattern = SPECIAL_CODE_TABLE.get(action);
    if (pattern !== undefined) {
      entries.push({ kind: 'action', action, pattern });
    }
  }
  return entries;
}

// Built once at module load. 39 characters, then space, confirm, undo, sos.
const ALL_ENTRIES: readonly MatchEntry[] = buildEntries();

/**
 * Returns every character and special action whose code starts with the prefix,
 * in fixed table order. The empty prefix returns all 43 entries.
 * Returns [] if the prefix has anything other than "." or "-". Never throws.
 * The result is a new array on every call.
 */
export function matchingCharacters(prefix: string): readonly MatchEntry[] {
  if (!PREFIX_PATTERN.test(prefix)) {
    return [];
  }
  return ALL_ENTRIES.filter((entry) => entry.pattern.startsWith(prefix));
}
