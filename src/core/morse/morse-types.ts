import type { Pattern, SupportedCharacter } from './morse-table';
import type { SpecialAction } from './special-codes';

export type { Pattern, SupportedCharacter, SpecialAction };

export type DecodeResult =
  | { readonly kind: 'character'; readonly character: SupportedCharacter }
  | { readonly kind: 'action'; readonly action: SpecialAction }
  | { readonly kind: 'invalid'; readonly pattern: string };

export type EncodeResult =
  | { readonly kind: 'found'; readonly pattern: Pattern }
  | { readonly kind: 'not-found' };

export type MatchEntry =
  | { readonly kind: 'character'; readonly character: SupportedCharacter; readonly pattern: Pattern }
  | { readonly kind: 'action'; readonly action: SpecialAction; readonly pattern: Pattern };

export interface EditingState {
  readonly text: string;
  readonly consecutiveUndos: number; // 0 or more
}

export type EditorEvent =
  | { readonly kind: 'confirm' }
  | { readonly kind: 'sos' }
  | { readonly kind: 'invalid'; readonly pattern: string };

export interface EditorOutput {
  readonly state: EditingState;
  readonly event: EditorEvent | null;
}
