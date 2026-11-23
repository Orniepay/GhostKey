import type { Pattern } from './morse-table';

/** All special actions, in table order. */
export const SPECIAL_ACTIONS = ['space', 'confirm', 'undo', 'sos'] as const;

export type SpecialAction = (typeof SPECIAL_ACTIONS)[number];

// The compiler fails if an action is missing or misspelled.
const CODES: Readonly<Record<SpecialAction, Pattern>> = {
  space: '..--',
  confirm: '.-.-',
  undo: '----',
  sos: '...---...',
};

/** Action to pattern, in table order. */
export const SPECIAL_CODE_TABLE: ReadonlyMap<SpecialAction, Pattern> = new Map(
  SPECIAL_ACTIONS.map((action): [SpecialAction, Pattern] => [action, CODES[action]]),
);

const REVERSE_TABLE: ReadonlyMap<Pattern, SpecialAction> = new Map(
  SPECIAL_ACTIONS.map((action): [Pattern, SpecialAction] => [CODES[action], action]),
);

/** Returns the action for a pattern, or undefined if there is none. Never throws. */
export function lookupAction(pattern: string): SpecialAction | undefined {
  return REVERSE_TABLE.get(pattern);
}
