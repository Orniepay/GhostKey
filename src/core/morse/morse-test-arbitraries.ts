// Shared fast-check generators for the morse-core tests. Test support only.
import * as fc from 'fast-check';
import { MORSE_CHARACTERS, lookupPattern } from './morse-table';
import type { SupportedCharacter } from './morse-table';
import { SPECIAL_ACTIONS, lookupAction } from './special-codes';
import type { SpecialAction } from './special-codes';
import type { DecodeResult, EditingState } from './morse-types';

const dotOrDash = fc.constantFrom('.', '-');

export const supportedCharacter: fc.Arbitrary<SupportedCharacter> = fc.constantFrom(
  ...MORSE_CHARACTERS,
);

export const lowercaseLetter: fc.Arbitrary<string> = fc.constantFrom(
  ...'abcdefghijklmnopqrstuvwxyz',
);

export const specialAction: fc.Arbitrary<SpecialAction> = fc.constantFrom(...SPECIAL_ACTIONS);

/** Dots and dashes. Mostly 0 to 12 long, sometimes 13 to 1,100 (past the 1,000 limit). */
export const dotDashString: fc.Arbitrary<string> = fc.oneof(
  { arbitrary: fc.array(dotOrDash, { maxLength: 12 }).map((s) => s.join('')), weight: 8 },
  {
    arbitrary: fc.array(dotOrDash, { minLength: 13, maxLength: 1100 }).map((s) => s.join('')),
    weight: 1,
  },
);

/** Dots and dashes that are in neither the Morse table nor the special code table. */
export const unknownDotDash: fc.Arbitrary<string> = dotDashString.filter(
  (s) => lookupPattern(s) === undefined && lookupAction(s) === undefined,
);

/** Any string, mixed with dot-dash strings so table hits are common. */
export const anyString: fc.Arbitrary<string> = fc.oneof(
  fc.string({ unit: 'binary', maxLength: 100 }),
  dotDashString,
);

const cleanWord: fc.Arbitrary<string> = fc
  .array(supportedCharacter, { minLength: 1, maxLength: 6 })
  .map((chars) => chars.join(''));

/** Text with no leading space and single spaces only. */
const cleanText: fc.Arbitrary<string> = fc
  .array(cleanWord, { maxLength: 5 })
  .map((words) => words.join(' '));

/** Edge-case text: may start with a space, contain double spaces, or end with spaces. */
const messyText: fc.Arbitrary<string> = fc.string({
  unit: fc.constantFrom('A', 'B', 'E', 'T', ' '),
  maxLength: 12,
});

export const editingState: fc.Arbitrary<EditingState> = fc.record({
  text: fc.oneof({ arbitrary: cleanText, weight: 4 }, { arbitrary: messyText, weight: 1 }),
  consecutiveUndos: fc.nat(5),
});

export const decodeResult: fc.Arbitrary<DecodeResult> = fc.oneof(
  supportedCharacter.map((character): DecodeResult => ({ kind: 'character', character })),
  specialAction.map((action): DecodeResult => ({ kind: 'action', action })),
  anyString.map((pattern): DecodeResult => ({ kind: 'invalid', pattern })),
);

export const nonUndoResult: fc.Arbitrary<DecodeResult> = decodeResult.filter(
  (r) => !(r.kind === 'action' && r.action === 'undo'),
);
