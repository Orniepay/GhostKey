# Requirements Document

## Introduction

Morse core is the pure TypeScript logic that decides what a finished Morse pattern means in Ghost Key. It lives in `src/core/morse/` and contains no React and no browser code, so it can be tested and works offline. It covers the Morse table, the special codes, decoding, encoding, prefix matching for the on-screen chart, and message editing (add a character, space, undo, confirm, SOS). It follows `.kiro/steering/morse-rules.md` and `.kiro/steering/testing-standards.md`.

Out of scope: press timing and calibration, autocorrect, word prediction, and all UI. Those are separate specs.

## Glossary

- **Morse_Core**: The set of pure TypeScript modules in `src/core/morse/`.
- **Pattern**: A string made only of the characters `.` (dot) and `-` (dash).
- **Morse_Table**: The mapping between each supported character and its Pattern, exactly as listed in `morse-rules.md`.
- **Supported_Character**: One of A-Z, 0-9, period, comma, or question mark.
- **Special_Action**: One of `space`, `confirm`, `undo`, or `sos`.
- **Special_Code_Table**: The mapping of Special_Actions to Patterns: space `..--`, confirm `.-.-`, undo `----`, SOS `...---...`.
- **Decoder**: The function `decodePattern(pattern)` in Morse_Core.
- **Decode_Result**: The value returned by the Decoder. It is one of: a character result (with the Supported_Character), an action result (with the Special_Action), or an invalid result.
- **Encoder**: The function `encodeCharacter(char)` in Morse_Core.
- **Prefix_Matcher**: The function `matchingCharacters(prefix)` in Morse_Core.
- **Match_Entry**: An entry returned by the Prefix_Matcher. It names a Supported_Character or a Special_Action together with its Pattern.
- **Message_Editor**: The pure function in Morse_Core that applies a Decode_Result to a message text and returns the new editing state and any event.
- **Editing_State**: The message text plus the count of consecutive undo results applied immediately before the current one.
- **Word**: A maximal run of non-space characters in the message text.
- **Editor_Event**: A value returned by the Message_Editor to signal `confirm`, `sos`, or `invalid` to the caller. The `invalid` event carries the invalid Pattern.

## Requirements

### Requirement 1: Morse table

**User Story:** As a user, I want every letter, digit, and common punctuation mark to have the standard Morse code, so that I can write any message.

#### Acceptance Criteria

1. THE Morse_Table SHALL contain exactly 39 Supported_Characters: the 26 uppercase letters A-Z, the 10 digits 0-9, period, comma, and question mark.
2. THE Morse_Table SHALL map each Supported_Character to the Pattern listed for it in `morse-rules.md`, with 39 of 39 mappings matching that file exactly.
3. THE Morse_Table SHALL map each Supported_Character to a distinct Pattern, so that no two Supported_Characters share the same Pattern.
4. THE Morse_Table SHALL contain only Patterns made of the symbols `.` and `-`, with a length of 1 to 6 symbols.
5. THE Morse_Core SHALL contain no import of React, no reference to browser objects (`window`, `document`, `localStorage`), and no network call in any of its source files.
6. IF a character that is not one of the 39 Supported_Characters is looked up in the Morse_Table, THEN THE Morse_Table SHALL return a "not found" result, SHALL NOT throw an error, and SHALL leave the table unchanged.
7. IF a Pattern that is not mapped to any Supported_Character is looked up in the Morse_Table, including an empty Pattern, THEN THE Morse_Table SHALL return a "not found" result, SHALL NOT throw an error, and SHALL leave the table unchanged.

### Requirement 2: Special codes

**User Story:** As a user, I want fixed codes for space, confirm, undo, and SOS, so that I can control the app with the same single switch.

#### Acceptance Criteria

1. THE Special_Code_Table SHALL map `space` to `..--`, `confirm` to `.-.-`, `undo` to `----`, and `sos` to `...---...`, and SHALL contain exactly these 4 entries.
2. THE Special_Code_Table SHALL contain no Pattern that is identical to any Pattern in the Morse_Table.
3. THE Special_Code_Table SHALL map each of the 4 Special_Actions to a different Pattern, so that no two Special_Actions share a Pattern.
4. WHEN the Decoder receives a Pattern that exactly equals a Pattern in the Special_Code_Table, THE Decoder SHALL return the matching Special_Action and SHALL NOT return a Morse_Table character.
5. WHEN the Decoder receives a Pattern that is a shorter prefix of a Special_Code_Table Pattern but is not equal to it (for example `...` compared with `...---...`), THE Decoder SHALL decode it by its own exact match only and SHALL NOT return a Special_Action.
6. IF the Decoder receives a Pattern that matches neither the Special_Code_Table nor the Morse_Table, THEN THE Decoder SHALL return an invalid result and SHALL NOT return any Special_Action.

### Requirement 3: Decode a pattern

**User Story:** As a user, I want each finished pattern to become the right character or action, so that my message says what I meant.

#### Acceptance Criteria

1. WHEN the Decoder receives a Pattern that appears in the Morse_Table, THE Decoder SHALL return a character result containing the Supported_Character mapped to that Pattern in the Morse_Table.
2. WHEN the Decoder receives a Pattern that appears in the Special_Code_Table, THE Decoder SHALL return an action result containing the Special_Action mapped to that Pattern in the Special_Code_Table.
3. IF the Decoder receives a string made only of `.` and `-` characters that appears in neither the Morse_Table nor the Special_Code_Table, THEN THE Decoder SHALL return an invalid result that contains the exact string it received, and SHALL NOT throw an error.
4. IF the Decoder receives an empty string, THEN THE Decoder SHALL return an invalid result that contains the empty string, and SHALL NOT throw an error.
5. IF the Decoder receives a string that contains any character other than `.` or `-` (including spaces, letters, digits, and other Unicode characters), or a string longer than 1,000 characters, THEN THE Decoder SHALL return an invalid result that contains the exact string it received, and SHALL NOT throw an error.
6. THE Decoder SHALL return a Decode_Result equal in type and content every time it receives the same input, regardless of earlier inputs, and SHALL NOT change any state outside the Decode_Result.
7. THE Decoder SHALL return a character result only for a Pattern that appears in the Morse_Table, and SHALL return an action result only for a Pattern that appears in the Special_Code_Table.
8. THE Decoder SHALL return an action result for every Pattern in the Special_Code_Table, and SHALL return a character result for every Pattern in the Morse_Table.

### Requirement 4: Encode a character

**User Story:** As a user, I want to see the Morse pattern for any character, so that I never need to memorize the code.

#### Acceptance Criteria

1. WHEN the Encoder receives exactly one character that is a Supported_Character, THE Encoder SHALL return a found result containing the Pattern for that character from the Morse_Table, and the Pattern SHALL be a non-empty sequence of dots and dashes.
2. WHEN the Encoder receives exactly one lowercase letter from "a" to "z", THE Encoder SHALL return the same found result as for the matching uppercase letter.
3. IF the Encoder receives input that is not exactly one Supported_Character after the lowercase-to-uppercase rule in criterion 2 (including an empty string, a string of two or more characters, a space, a digit or symbol not in the Morse_Table, and a non-ASCII character), THEN THE Encoder SHALL return a not-found result that carries no Pattern, SHALL NOT throw an error, and SHALL leave the Morse_Table unchanged.
4. FOR ALL Supported_Characters, decoding the Pattern returned by the Encoder SHALL return a character result with the original Supported_Character (round-trip property).
5. FOR ALL lowercase letters from "a" to "z", decoding the Pattern returned by the Encoder SHALL return a character result with the matching uppercase letter (lowercase round-trip property).
6. FOR ALL strings of 0 to 100 characters, THE Encoder SHALL return either a found result or a not-found result and SHALL NOT throw an error (totality property).

### Requirement 5: Prefix matching for the chart

**User Story:** As a user, I want the chart to light up the characters that still match what I have pressed, so that I can find the next press without memorizing.

#### Acceptance Criteria

1. WHEN the Prefix_Matcher receives a non-empty Pattern prefix, THE Prefix_Matcher SHALL return one Match_Entry for every Supported_Character and every Special_Action whose Pattern starts with the prefix, and SHALL return no other Match_Entry.
2. WHEN the Prefix_Matcher receives an empty prefix, THE Prefix_Matcher SHALL return exactly 43 Match_Entries: one for each of the 39 Supported_Characters and one for each of the 4 Special_Actions.
3. WHEN the Prefix_Matcher receives a Pattern that is exactly a full Pattern in either table, THE Prefix_Matcher SHALL include the Match_Entry for that Pattern in the result, together with the Match_Entry of every longer Pattern that starts with it.
4. WHEN the Prefix_Matcher receives the prefix `.-`, THE Prefix_Matcher SHALL return exactly 9 Match_Entries: A, R, W, L, P, J, 1, period, and confirm (`.-.-`).
5. IF no Pattern starts with the prefix, THEN THE Prefix_Matcher SHALL return an empty list.
6. IF the Prefix_Matcher receives a string that contains a character other than `.` or `-`, THEN THE Prefix_Matcher SHALL return an empty list and SHALL NOT throw an error.
7. FOR ALL prefixes, THE Prefix_Matcher SHALL return a list in which every Match_Entry Pattern starts with the prefix, and each Match_Entry appears exactly once.
8. FOR ALL prefixes p and all characters c in `.` and `-`, THE Prefix_Matcher result for `p + c` SHALL be a subset of the result for `p`.
9. THE Prefix_Matcher SHALL return Match_Entries in a fixed order: Supported_Characters in Morse_Table order (A-Z, 0-9, period, comma, question mark), followed by Special_Actions in the order `space`, `confirm`, `undo`, `sos`, so that the same prefix always returns the same list.

### Requirement 6: Apply a decoded result to the message

**User Story:** As a user, I want each decoded result to change my message in a predictable way, so that I can write, fix, and finish messages with one switch.

#### Acceptance Criteria

1. WHEN the Message_Editor receives a character result, THE Message_Editor SHALL return an Editing_State whose message text is the received message text followed by exactly one Supported_Character.
2. WHEN the Message_Editor receives an action result for `space`, THE Message_Editor SHALL return an Editing_State whose message text is the received message text followed by exactly one space character (U+0020) only when the message text is not empty and does not already end with a space; otherwise THE Message_Editor SHALL return the message text unchanged. In both cases THE Message_Editor SHALL return no Editor_Event, and the consecutive undo count SHALL be set to 0 as stated in criterion 8.
3. WHEN the Message_Editor receives an action result for `undo`, the message text is not empty, and the consecutive undo count is 0, THE Message_Editor SHALL remove exactly the last character of the message text and SHALL set the consecutive undo count to 1.
4. WHEN the Message_Editor receives an action result for `undo`, the message text is not empty, and the consecutive undo count is 1 or more, THE Message_Editor SHALL remove all trailing spaces and then the last Word (the run of non-space characters before them) from the message text, and SHALL increase the consecutive undo count by 1. If the received message text contains only spaces (possible only for an arbitrary Editing_State, not from a sequence of decoded results starting from an empty message text), THE Message_Editor SHALL return an empty message text.
5. WHEN the Message_Editor receives an action result for `undo` and the message text is empty, THE Message_Editor SHALL return the message text unchanged, SHALL return no Editor_Event, and SHALL increase the consecutive undo count by 1.
6. WHEN the Message_Editor receives an action result for `confirm`, THE Message_Editor SHALL return exactly one `confirm` Editor_Event and SHALL return the message text unchanged.
7. WHEN the Message_Editor receives an action result for `sos`, THE Message_Editor SHALL return exactly one `sos` Editor_Event and SHALL return the message text unchanged.
8. WHEN the Message_Editor receives any valid result other than an `undo` action result, THE Message_Editor SHALL set the consecutive undo count to 0.
9. IF the Message_Editor receives an invalid result, THEN THE Message_Editor SHALL return the message text unchanged, SHALL set the consecutive undo count to 0, and SHALL return exactly one `invalid` Editor_Event that contains the invalid Pattern, so that the caller can show it and offer a suggestion.
10. THE Message_Editor SHALL return a new Editing_State object for every result and SHALL leave the received Editing_State unchanged (all its field values equal to their values before the call).
11. FOR ALL message texts and all Supported_Characters, applying the character result to an Editing_State with consecutive undo count 0 and then applying one `undo` action result SHALL return the original message text (undo restores).
12. FOR ALL message texts, applying any result that is not an `undo` action result SHALL return a message text that starts with the original message text (no existing character is removed or changed).
13. FOR ALL sequences of Decode_Results applied in order, starting from an empty message text, THE Message_Editor SHALL produce a message text that never starts with a space and never contains two spaces in a row.
