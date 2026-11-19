---
inclusion: fileMatch
fileMatchPattern: ["**/*.test.ts", "**/*.test.tsx"]
---

# Testing standards: Ghost Key

## Tools
- Vitest: test runner
- fast-check: property-based tests (tests that try many random inputs to prove a rule always holds)
- React Testing Library with jsdom: UI tests

## What must be tested
- All logic in `src/core/` gets unit tests and property-based tests.
- UI tests prove that every action can be done with keyboard only and with single-switch input (accessibility rule 1).

## Required properties (minimum)
1. **Round trip:** for every supported character, encoding it to Morse and decoding it back gives the same character.
2. **Special codes are never characters:** space, confirm, undo, and SOS never decode as a letter, digit, or punctuation mark.
3. **Unknown patterns are safe:** any pattern not in the table is marked invalid. It never decodes as a character and never crashes.
4. **Timing is consistent:** for any calibrated limits, a press shorter than the dash limit is always a dot, and a longer one is always a dash.
5. **Undo restores:** adding any character and then undoing returns exactly the previous text.
6. **Yes and no are protected:** autocorrect and AI expansion never change "yes" or "no".

## Rules
- At least 100 runs per property.
- Each property test has a comment naming the requirement it checks, e.g. `// Validates: Requirement 2.1`.
- If a property test finds a bug, keep the failing input as a regular unit test too, and add a note to `docs/kiro-log.md`.
- No real network or AI calls in tests. Use fake (mock) versions of services.
- All tests must pass before a task is marked done.
- Never weaken or delete a test to make it pass. Fix the code, or ask first.