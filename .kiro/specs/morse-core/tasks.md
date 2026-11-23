# Implementation Plan: morse-core

## Overview

This plan builds the pure TypeScript Morse logic in `src/core/morse/`. It starts with the TypeScript configuration so that `npm run build` type-checks tests from the first test file. It then builds the tables, types, shared test generators, decoder, encoder, prefix matcher, and message editor in dependency order. Each implementation task includes its own unit tests and its own property tests, so no code is left untested.

Rules that apply to every task:

- Every unit test sub-task and every property test sub-task is required.
- Each of the 18 design properties is implemented by exactly one property test, with `fc.assert(..., { numRuns: 100 })` or higher.
- Each property test carries two comments: `// Feature: morse-core, Property N: <title>` and `// Validates: Requirements X.Y`.
- Named exports only. No `any`. No `as` cast to `SupportedCharacter`. Import paths match file names exactly, including case.
- Vitest APIs (`describe`, `it`, `expect`) are imported from `'vitest'`. No globals.
- No new packages. `vitest`, `fast-check`, and the `"test": "vitest --run"` script already exist.
- All files are in `src/core/morse/` unless a task says otherwise.

## Tasks

- [ ] 1. Configure TypeScript so the build type-checks tests in strict mode
  - [ ] 1.1 Create `tsconfig.test.json` and register it
    - Create `tsconfig.test.json` in the repository root exactly as given in the design section "Build and TypeScript configuration": `types: ["node"]`, lib ES2023 without DOM, `"strict": true`, and `include` of `src/**/*.test.ts` and `src/core/**/*-test-arbitraries.ts`
    - Add `{ "path": "./tsconfig.test.json" }` to `references` in `tsconfig.json`
    - Do not use `skipLibCheck` changes, `@ts-nocheck`, or any option that weakens strict mode
    - If `tsc -b` reports "No inputs were found" for the test project before the first test file exists, that is expected. Task 2.2 adds the first test file, and the first `npm run build` check is in checkpoint 3
    - _Requirements: 1.5 (tests may import `node:fs` for the purity test without giving the app Node types)_

  - [ ] 1.2 Update the app and node configs
    - In `tsconfig.app.json`, add `"strict": true` and `"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/*-test-arbitraries.ts"]`
    - In `tsconfig.node.json`, add `"strict": true`
    - Keep every existing option unchanged
    - _Requirements: 1.5_

- [ ] 2. Implement the Morse table
  - [ ] 2.1 Create `morse-table.ts`
    - Export `Pattern`, `MORSE_CHARACTERS` (39 entries, `as const`, in table order), and `SupportedCharacter` (derived from the array)
    - Define the `PATTERNS` record as `Readonly<Record<SupportedCharacter, Pattern>>` with all 39 patterns from `morse-rules.md`
    - Export `MORSE_TABLE` (a read-only `Map` built by iterating `MORSE_CHARACTERS`, frozen or exposed as `ReadonlyMap`)
    - Export `isSupportedCharacter(value: string): value is SupportedCharacter` using a `Set` built once from `MORSE_CHARACTERS`
    - Export `lookupPattern(pattern)` (reverse lookup through a `Map`) and `lookupCharacter(character)` (calls `isSupportedCharacter` first); both return `undefined` for not found and never throw
    - No `as` cast to `SupportedCharacter` anywhere
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7_

  - [ ] 2.2 Write unit tests in `morse-table.test.ts`
    - `MORSE_CHARACTERS` has length 39, has no duplicates, and its order matches the literal list in `morse-rules.md`
    - All 39 patterns equal the `morse-rules.md` table, are distinct, use only `.` and `-`, and have length 1 to 6
    - Lookups of `"1x"`, `""`, `"__proto__"`, and `"constructor"` return `undefined` for both `lookupPattern` and `lookupCharacter`, and do not throw
    - Table content is the same before and after the failed lookups
    - Include the compile-time example with `// @ts-expect-error` that assigns `'a'` to a `SupportedCharacter` constant, as shown in the design section "Compile-time checks"
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7_

- [ ] 3. Checkpoint - Table is in place
  - Run `npm test` and `npm run build`. The build must type-check `morse-table.test.ts` through `tsconfig.test.json` and the `@ts-expect-error` line must be accepted.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement the special codes
  - [ ] 4.1 Create `special-codes.ts`
    - Export `SPECIAL_ACTIONS` (`['space', 'confirm', 'undo', 'sos'] as const`) and `SpecialAction` (derived)
    - Define `CODES` as `Readonly<Record<SpecialAction, Pattern>>` with `..--`, `.-.-`, `----`, `...---...`, importing the `Pattern` type from `./morse-table`
    - Export `SPECIAL_CODE_TABLE` (a read-only `Map` built by iterating `SPECIAL_ACTIONS`) and `lookupAction(pattern)` returning `SpecialAction | undefined`
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 4.2 Write unit tests in `special-codes.test.ts`
    - `SPECIAL_ACTIONS` order is space, confirm, undo, sos
    - `SPECIAL_CODE_TABLE` has exactly 4 entries with the correct patterns, and the 4 patterns are distinct
    - No special pattern appears in `MORSE_TABLE`
    - `lookupAction` returns `undefined` for unknown strings, `""`, `"__proto__"`, and `"constructor"`, and does not throw
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 5. Define the shared types
  - [ ] 5.1 Create `morse-types.ts`
    - Type-only imports and re-exports of `Pattern`, `SupportedCharacter` (from `./morse-table`) and `SpecialAction` (from `./special-codes`), using `export type`
    - Export `DecodeResult`, `EncodeResult`, `MatchEntry`, `EditingState`, `EditorEvent`, and `EditorOutput` exactly as in the design, with `readonly` fields
    - No runtime code, so there is no test file for this task. Type correctness is checked by `npm run build` and by the tests that use these types
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.3, 5.1, 6.1, 6.6, 6.7, 6.9_

- [ ] 6. Create the shared test generators
  - [ ] 6.1 Create `morse-test-arbitraries.ts`
    - Export fast-check generators: `supportedCharacter`, `lowercaseLetter`, `specialAction`, `dotDashString` (length 0 to 12, plus some up to 1,100), `unknownDotDash` (filtered with `lookupPattern` and `lookupAction` so it is in neither table), `anyString` (`fc.string({ unit: 'binary', maxLength: 100 })` mixed with `dotDashString`), `editingState` (text from `supportedCharacter` and single spaces, plus arbitrary text with leading or double spaces, `consecutiveUndos` from `fc.nat(5)`), `decodeResult` (`fc.oneof` of character, action, and invalid results), and `nonUndoResult`
    - Build `supportedCharacter` with `fc.constantFrom(...MORSE_CHARACTERS)` so no cast is needed
    - Use named exports and typed generators (`fc.Arbitrary<...>`). No `any`
    - This file is test support and is not scanned by the purity test
    - _Requirements: 3.3, 3.4, 3.5, 4.5, 4.6, 5.7, 6.1, 6.9, 6.13_

- [ ] 7. Checkpoint - Foundations are in place
  - Run `npm test` and `npm run build`. Both must pass with the tests and generators type-checked through `tsconfig.test.json`.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement the decoder
  - [ ] 8.1 Create `morse-decoder.ts`
    - Export `MAX_PATTERN_LENGTH = 1000` and `decodePattern(pattern: string): DecodeResult`
    - Return `invalid` (with the exact input) when the length is over 1,000, the string is empty, or it does not match `/^[.-]+$/`
    - Look up special codes first, then the Morse table, then return `invalid`
    - Never throw, no state outside the result
    - _Requirements: 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ] 8.2 Write unit tests in `morse-decoder.test.ts`
    - Each special code decodes to its action
    - `...` decodes to the character `S`, not an action; `...---...` decodes to `sos`
    - Every one of the 39 table patterns decodes to its character, and the 4 special patterns decode to their actions
    - Empty string is invalid and carries `""`
    - A 1,000-character dot string is handled without throwing, and a 1,001-character dot string is invalid
    - Strings with a space, a letter, a digit, or non-ASCII characters are invalid and carry the exact input
    - _Requirements: 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.8_

  - [ ] 8.3 Write property test for special codes
    - **Property 2: Special codes never decode as characters**
    - For every `specialAction`, decoding its pattern gives that action and never a character. For every non-empty proper prefix of a special pattern, decoding never gives an action
    - Tag with `// Feature: morse-core, Property 2: Special codes never decode as characters` and `// Validates: Requirements 2.4, 2.5, 3.2`
    - **Validates: Requirements 2.4, 2.5, 3.2**

  - [ ] 8.4 Write property test for unknown patterns
    - **Property 3: Unknown patterns are invalid and safe**
    - For any string in neither table (dot-dash strings, empty, other Unicode, longer than 1,000 characters), `decodePattern` does not throw and returns `invalid` with the exact input
    - Tag with `// Feature: morse-core, Property 3: Unknown patterns are invalid and safe` and `// Validates: Requirements 1.7, 2.6, 3.3, 3.4, 3.5`
    - **Validates: Requirements 1.7, 2.6, 3.3, 3.4, 3.5**

  - [ ] 8.5 Write property test for result kind and determinism
    - **Property 4: Decoder result kind matches table membership and is deterministic**
    - For any string `s`: a character result only if `s` is a Morse pattern, an action result only if `s` is a special pattern, otherwise invalid. Two calls give deeply equal results and the tables are unchanged
    - Tag with `// Feature: morse-core, Property 4: Decoder result kind matches table membership and is deterministic` and `// Validates: Requirements 3.6, 3.7`
    - **Validates: Requirements 3.6, 3.7**

- [ ] 9. Implement the encoder
  - [ ] 9.1 Create `morse-encoder.ts`
    - Export `encodeCharacter(input: string): EncodeResult`
    - Return `not-found` unless `input.length === 1`
    - Uppercase only `a` to `z` with a plain range check, not `toUpperCase()`
    - Use `lookupCharacter`, which narrows through `isSupportedCharacter`. No `as` cast
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [ ] 9.2 Write unit tests in `morse-encoder.test.ts`
    - `"a"` and `"A"` both give found with `.-`
    - `""`, `"AB"`, `" "`, `"!"`, `"é"`, `"ß"`, `"ı"`, and an astral character such as `"😀"` give not-found with no pattern
    - Every one of the 39 supported characters gives a found result with a non-empty dot-dash pattern
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 9.3 Write property test for the round trip
    - **Property 1: Encode then decode round trip**
    - For any supported character `c`, `decodePattern` of the encoded pattern returns that character. For any lowercase letter, the encoded pattern equals the uppercase letter's pattern and decodes to the uppercase letter
    - Tag with `// Feature: morse-core, Property 1: Encode then decode round trip` and `// Validates: Requirements 3.1, 3.8, 4.1, 4.2, 4.4, 4.5`
    - **Validates: Requirements 3.1, 3.8, 4.1, 4.2, 4.4, 4.5**

  - [ ] 9.4 Write property test for encoder totality
    - **Property 5: Encoder is total and rejects non-characters**
    - For any string of 0 to 100 characters, including Unicode, `encodeCharacter` does not throw and returns found or not-found. If the string is not exactly one supported character after the `a` to `z` rule, the result is not-found with no pattern and the table is unchanged
    - Tag with `// Feature: morse-core, Property 5: Encoder is total and rejects non-characters` and `// Validates: Requirements 1.6, 4.3, 4.6`
    - **Validates: Requirements 1.6, 4.3, 4.6**

- [ ] 10. Checkpoint - Decoder and encoder pass
  - Run `npm test` and `npm run build`.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement the prefix matcher
  - [ ] 11.1 Create `prefix-matcher.ts`
    - Export `matchingCharacters(prefix: string): readonly MatchEntry[]`
    - Build the full ordered list once at module load: 39 characters in table order, then `space`, `confirm`, `undo`, `sos` (43 entries), from `MORSE_CHARACTERS`, `MORSE_TABLE`, `SPECIAL_ACTIONS`, and `SPECIAL_CODE_TABLE`
    - Return `[]` when the prefix contains anything other than `.` or `-`; the empty prefix is allowed
    - Return a new array from `filter` with `startsWith` on every call so callers cannot change the shared list
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9_

  - [ ] 11.2 Write unit tests in `prefix-matcher.test.ts`
    - Empty prefix returns 43 entries in the fixed order
    - Prefix `.-` returns exactly A, R, W, L, P, J, 1, period, and confirm
    - A full pattern such as `...` returns `S` and every longer pattern that starts with it
    - A 9-dot prefix returns `[]`
    - A prefix with a space or a letter returns `[]` and does not throw
    - Changing a returned array does not change the next result
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.9_

  - [ ] 11.3 Write property test for the model filter
    - **Property 6: Prefix matcher equals the model filter**
    - For any dot-dash prefix, including empty, the result equals the full ordered list filtered by `startsWith`. Every pattern starts with the prefix, each entry appears once, the order is fixed, and the list is empty when nothing matches
    - Tag with `// Feature: morse-core, Property 6: Prefix matcher equals the model filter` and `// Validates: Requirements 5.1, 5.3, 5.5, 5.7, 5.9`
    - **Validates: Requirements 5.1, 5.3, 5.5, 5.7, 5.9**

  - [ ] 11.4 Write property test for narrowing
    - **Property 7: Extending a prefix only narrows the result**
    - For any prefix `p` and `c` in `.` and `-`, every entry in `matchingCharacters(p + c)` is also in `matchingCharacters(p)`
    - Tag with `// Feature: morse-core, Property 7: Extending a prefix only narrows the result` and `// Validates: Requirements 5.8`
    - **Validates: Requirements 5.8**

  - [ ] 11.5 Write property test for non-dot-dash prefixes
    - **Property 8: Prefixes with other characters match nothing**
    - For any string with at least one character other than `.` or `-`, the result is an empty list and nothing throws
    - Tag with `// Feature: morse-core, Property 8: Prefixes with other characters match nothing` and `// Validates: Requirements 5.6`
    - **Validates: Requirements 5.6**

- [ ] 12. Implement the message editor
  - [ ] 12.1 Create `message-editor.ts`
    - Export `EMPTY_EDITING_STATE` (`{ text: '', consecutiveUndos: 0 }`) and `applyDecodeResult(state, result): EditorOutput`
    - Follow the behavior table in the design for character, `space`, `undo` (empty, first undo, repeated undo), `confirm`, `sos`, and invalid
    - Remove a word with `/ +$/` then `/[^ ]*$/`, so `"HI THERE"` becomes `"HI "`
    - Use an exhaustive `switch` on `result.kind` and `result.action` that ends with a `never` check
    - Always return new objects and never change the input state
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

  - [ ] 12.2 Write unit tests in `message-editor.test.ts`
    - One undo removes one character; two undos in a row remove the last word (`"HI THERE"` becomes `"HI "`)
    - Undo on empty text keeps the text, adds 1 to the count, and returns no event
    - Undo on a text of only spaces after a previous undo gives an empty text
    - A leading `space` and a double `space` are ignored
    - `confirm` and `sos` keep the text and return their event
    - An invalid result keeps the text and returns an `invalid` event with the pattern
    - A frozen input state is not changed and the returned state is a different object
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.9, 6.10_

  - [ ] 12.3 Write property test for appending a character
    - **Property 9: A character result appends exactly one character**
    - Tag with `// Feature: morse-core, Property 9: A character result appends exactly one character` and `// Validates: Requirements 6.1`
    - **Validates: Requirements 6.1**

  - [ ] 12.4 Write property test for space
    - **Property 10: Space is added only when allowed**
    - Tag with `// Feature: morse-core, Property 10: Space is added only when allowed` and `// Validates: Requirements 6.2`
    - **Validates: Requirements 6.2**

  - [ ] 12.5 Write property test for undo
    - **Property 11: Undo removes a character first, then whole words**
    - Cover the empty text, first undo, and repeated undo cases, and the only-spaces case
    - Tag with `// Feature: morse-core, Property 11: Undo removes a character first, then whole words` and `// Validates: Requirements 6.3, 6.4, 6.5`
    - **Validates: Requirements 6.3, 6.4, 6.5**

  - [ ] 12.6 Write property test for confirm and SOS
    - **Property 12: Confirm and SOS report an event and keep the text**
    - Tag with `// Feature: morse-core, Property 12: Confirm and SOS report an event and keep the text` and `// Validates: Requirements 6.6, 6.7`
    - **Validates: Requirements 6.6, 6.7**

  - [ ] 12.7 Write property test for the undo count reset
    - **Property 13: Any valid result other than undo resets the undo count**
    - Tag with `// Feature: morse-core, Property 13: Any valid result other than undo resets the undo count` and `// Validates: Requirements 6.8`
    - **Validates: Requirements 6.8**

  - [ ] 12.8 Write property test for invalid results
    - **Property 14: Invalid results are reported and change nothing**
    - Tag with `// Feature: morse-core, Property 14: Invalid results are reported and change nothing` and `// Validates: Requirements 6.9`
    - **Validates: Requirements 6.9**

  - [ ] 12.9 Write property test for input immutability
    - **Property 15: The editor does not change its input**
    - Use deeply frozen input states and check the returned state is a different object
    - Tag with `// Feature: morse-core, Property 15: The editor does not change its input` and `// Validates: Requirements 6.10`
    - **Validates: Requirements 6.10**

  - [ ] 12.10 Write property test for undo restore
    - **Property 16: Undo restores the previous text**
    - Tag with `// Feature: morse-core, Property 16: Undo restores the previous text` and `// Validates: Requirements 6.11`
    - **Validates: Requirements 6.11**

  - [ ] 12.11 Write property test for kept text
    - **Property 17: Results other than undo keep existing text**
    - Tag with `// Feature: morse-core, Property 17: Results other than undo keep existing text` and `// Validates: Requirements 6.12`
    - **Validates: Requirements 6.12**

  - [ ] 12.12 Write property test for spacing over sequences
    - **Property 18: No leading or double spaces from any sequence**
    - Apply any sequence of decode results from `EMPTY_EDITING_STATE` and check the text after every step
    - Tag with `// Feature: morse-core, Property 18: No leading or double spaces from any sequence` and `// Validates: Requirements 6.13`
    - **Validates: Requirements 6.13**

- [ ] 13. Checkpoint - Prefix matcher and editor pass
  - Run `npm test` and `npm run build`.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Add the barrel file
  - [ ] 14.1 Create `index.ts`
    - Re-export with named exports only (`export { ... } from './morse-table'` and so on, `export type { ... }` for types) from `morse-types`, `morse-table`, `special-codes`, `morse-decoder`, `morse-encoder`, `prefix-matcher`, and `message-editor`
    - Do not re-export `morse-test-arbitraries`
    - No `export default`. No test file, since the file only re-exports. `npm run build` checks that every re-export resolves
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [ ] 15. Add the purity test
  - [ ] 15.1 Write `morse-purity.test.ts`
    - Read every non-test source file in `src/core/morse/` with `node:fs` and exclude `*.test.ts` and `morse-test-arbitraries.ts`
    - Strip block comments with `/\/\*[\s\S]*?\*\//g`, then line comments with `/\/\/.*$/gm`
    - Fail on any of the regexes in the design table: `window`, `document`, `localStorage`, `fetch`, a React import, and the three `any` forms (annotation, cast, generic). The failure message names the file and the pattern
    - _Requirements: 1.5_

  - [ ] 15.2 Add scanner self-checks to `morse-purity.test.ts`
    - Run the scanner on inline strings: the word `document` in a comment passes, the same word in code fails, and `documentation` and `windowSize` do not trigger
    - Also check that `: any`, `as any`, and `<any>` each fail
    - _Requirements: 1.5_

- [ ] 16. Final checkpoint - Full verification
  - Run `npm test`, `npm run lint`, and `npm run build`. All three must pass with no skipped checks and no weakened strict mode.
  - Confirm that all 18 property tests exist, each with `numRuns` of at least 100 and both tag comments.
  - Confirm that no `as` cast to `SupportedCharacter`, no `any`, and no default export exists in `src/core/morse/`.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- No task is optional. Every unit test and property test sub-task must be done in the same task as the code it covers.
- Each task references the specific requirement clauses it covers for traceability.
- Property tests for the same file are in separate waves in the graph, because they write to the same test file.
- If a property test finds a bug, keep the failing input as a unit test and add a note to `docs/kiro-log.md`. Never weaken or delete a test to make it pass.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["8.1", "9.1", "11.1", "12.1"] },
    { "id": 7, "tasks": ["8.2", "9.2", "11.2", "12.2", "14.1"] },
    { "id": 8, "tasks": ["8.3", "9.3", "11.3", "12.3", "15.1"] },
    { "id": 9, "tasks": ["8.4", "9.4", "11.4", "12.4", "15.2"] },
    { "id": 10, "tasks": ["8.5", "11.5", "12.5"] },
    { "id": 11, "tasks": ["12.6"] },
    { "id": 12, "tasks": ["12.7"] },
    { "id": 13, "tasks": ["12.8"] },
    { "id": 14, "tasks": ["12.9"] },
    { "id": 15, "tasks": ["12.10"] },
    { "id": 16, "tasks": ["12.11"] },
    { "id": 17, "tasks": ["12.12"] }
  ]
}
```
