// Public API of the Morse core. Pattern, SupportedCharacter and SpecialAction
// are exported once, from the files that define them.
export type {
  DecodeResult,
  EditingState,
  EditorEvent,
  EditorOutput,
  EncodeResult,
  MatchEntry,
} from './morse-types';

export {
  MORSE_CHARACTERS,
  MORSE_TABLE,
  isSupportedCharacter,
  lookupCharacter,
  lookupPattern,
} from './morse-table';
export type { Pattern, SupportedCharacter } from './morse-table';

export { SPECIAL_ACTIONS, SPECIAL_CODE_TABLE, lookupAction } from './special-codes';
export type { SpecialAction } from './special-codes';

export { MAX_PATTERN_LENGTH, decodePattern } from './morse-decoder';
export { encodeCharacter } from './morse-encoder';
export { matchingCharacters } from './prefix-matcher';
export { EMPTY_EDITING_STATE, applyDecodeResult } from './message-editor';
