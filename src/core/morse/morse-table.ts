/** A Morse pattern. By convention it contains only "." (dot) and "-" (dash). */
export type Pattern = string;

/** All 39 supported characters, in table order. */
export const MORSE_CHARACTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
  '.', ',', '?',
] as const;

export type SupportedCharacter = (typeof MORSE_CHARACTERS)[number];

// The compiler fails if a character is missing or misspelled.
const PATTERNS: Readonly<Record<SupportedCharacter, Pattern>> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '0': '-----',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
};

/** Character to pattern, in table order. */
export const MORSE_TABLE: ReadonlyMap<SupportedCharacter, Pattern> = new Map(
  MORSE_CHARACTERS.map((character): [SupportedCharacter, Pattern] => [
    character,
    PATTERNS[character],
  ]),
);

const CHARACTER_SET: ReadonlySet<string> = new Set<string>(MORSE_CHARACTERS);

const REVERSE_TABLE: ReadonlyMap<Pattern, SupportedCharacter> = new Map(
  MORSE_CHARACTERS.map((character): [Pattern, SupportedCharacter] => [
    PATTERNS[character],
    character,
  ]),
);

export function isSupportedCharacter(value: string): value is SupportedCharacter {
  return CHARACTER_SET.has(value);
}

/** Returns the character for a pattern, or undefined if there is none. */
export function lookupPattern(pattern: string): SupportedCharacter | undefined {
  return REVERSE_TABLE.get(pattern);
}

/** Returns the pattern for a character, or undefined if it is not supported. */
export function lookupCharacter(character: string): Pattern | undefined {
  if (!isSupportedCharacter(character)) {
    return undefined;
  }
  return MORSE_TABLE.get(character);
}
