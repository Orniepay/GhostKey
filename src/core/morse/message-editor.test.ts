import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyDecodeResult, EMPTY_EDITING_STATE } from './message-editor';
import {
  anyString,
  decodeResult,
  editingState,
  nonUndoResult,
  supportedCharacter,
} from './morse-test-arbitraries';
import type { DecodeResult, EditingState } from './morse-types';

const undo: DecodeResult = { kind: 'action', action: 'undo' };
const space: DecodeResult = { kind: 'action', action: 'space' };

function ch(character: 'H' | 'I' | 'T'): DecodeResult {
  return { kind: 'character', character };
}

describe('applyDecodeResult', () => {
  it('adds a character and resets the undo count', () => {
    const out = applyDecodeResult({ text: 'H', consecutiveUndos: 2 }, ch('I'));
    expect(out.state).toEqual({ text: 'HI', consecutiveUndos: 0 });
    expect(out.event).toBeNull();
  });

  it('one undo removes one character', () => {
    const out = applyDecodeResult({ text: 'HI', consecutiveUndos: 0 }, undo);
    expect(out.state).toEqual({ text: 'H', consecutiveUndos: 1 });
    expect(out.event).toBeNull();
  });

  it('two undos in a row remove the last word', () => {
    const first = applyDecodeResult({ text: 'HI THERE', consecutiveUndos: 0 }, undo);
    expect(first.state.text).toBe('HI THER');
    const second = applyDecodeResult(first.state, undo);
    expect(second.state).toEqual({ text: 'HI ', consecutiveUndos: 2 });
    expect(second.event).toBeNull();
  });

  it('undo on empty text keeps the text, adds 1 to the count, and returns no event', () => {
    const out = applyDecodeResult(EMPTY_EDITING_STATE, undo);
    expect(out.state).toEqual({ text: '', consecutiveUndos: 1 });
    expect(out.event).toBeNull();
  });

  it('undo on only spaces after a previous undo gives empty text', () => {
    const out = applyDecodeResult({ text: '  ', consecutiveUndos: 1 }, undo);
    expect(out.state.text).toBe('');
    expect(out.event).toBeNull();
  });

  it('adds a space after a character', () => {
    const out = applyDecodeResult({ text: 'HI', consecutiveUndos: 0 }, space);
    expect(out.state.text).toBe('HI ');
  });

  it('ignores a leading space', () => {
    const out = applyDecodeResult(EMPTY_EDITING_STATE, space);
    expect(out.state.text).toBe('');
    expect(out.event).toBeNull();
  });

  it('ignores a double space', () => {
    const out = applyDecodeResult({ text: 'HI ', consecutiveUndos: 0 }, space);
    expect(out.state.text).toBe('HI ');
  });

  it('confirm keeps the text and returns a confirm event', () => {
    const out = applyDecodeResult(
      { text: 'HI', consecutiveUndos: 1 },
      { kind: 'action', action: 'confirm' },
    );
    expect(out.state).toEqual({ text: 'HI', consecutiveUndos: 0 });
    expect(out.event).toEqual({ kind: 'confirm' });
  });

  it('sos keeps the text and returns an sos event', () => {
    const out = applyDecodeResult(
      { text: 'HI', consecutiveUndos: 1 },
      { kind: 'action', action: 'sos' },
    );
    expect(out.state).toEqual({ text: 'HI', consecutiveUndos: 0 });
    expect(out.event).toEqual({ kind: 'sos' });
  });

  it('an invalid result keeps the text and returns an invalid event with the pattern', () => {
    const out = applyDecodeResult(
      { text: 'HI', consecutiveUndos: 1 },
      { kind: 'invalid', pattern: '.-.-.-.-' },
    );
    expect(out.state).toEqual({ text: 'HI', consecutiveUndos: 0 });
    expect(out.event).toEqual({ kind: 'invalid', pattern: '.-.-.-.-' });
  });

  it('does not change a frozen input state and returns a different object', () => {
    const input: EditingState = Object.freeze({ text: 'HIT', consecutiveUndos: 0 });
    const results: DecodeResult[] = [
      ch('T'),
      space,
      undo,
      { kind: 'action', action: 'confirm' },
      { kind: 'action', action: 'sos' },
      { kind: 'invalid', pattern: '......' },
    ];
    for (const result of results) {
      const out = applyDecodeResult(input, result);
      expect(out.state).not.toBe(input);
    }
    expect(input).toEqual({ text: 'HIT', consecutiveUndos: 0 });
  });
});

describe('applyDecodeResult properties', () => {
  // Feature: morse-core, Property 9: A character result appends exactly one character
  // Validates: Requirements 6.1
  it('appends exactly one character, resets the undo count, and returns no event', () => {
    fc.assert(
      fc.property(editingState, supportedCharacter, (state, c) => {
        const out = applyDecodeResult(state, { kind: 'character', character: c });
        expect(out.state.text).toBe(state.text + c);
        expect(out.state.consecutiveUndos).toBe(0);
        expect(out.event).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});

describe('applyDecodeResult space property', () => {
  // Feature: morse-core, Property 10: Space is added only when allowed
  // Validates: Requirements 6.2
  it('adds one space only when text is non-empty and does not end with a space', () => {
    fc.assert(
      fc.property(editingState, (state) => {
        const out = applyDecodeResult(state, space);
        const allowed = state.text.length > 0 && !state.text.endsWith(' ');
        expect(out.state.text).toBe(allowed ? state.text + ' ' : state.text);
        expect(out.state.consecutiveUndos).toBe(0);
        expect(out.event).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});

describe('applyDecodeResult undo property', () => {
  // Expected value computed with trimEnd and lastIndexOf, not the implementation's regexes.
  function expectedAfterWordUndo(text: string): string {
    const trimmed = text.trimEnd();
    const lastSpace = trimmed.lastIndexOf(' ');
    return lastSpace === -1 ? '' : trimmed.slice(0, lastSpace + 1);
  }

  const onlySpacesState: fc.Arbitrary<EditingState> = fc.record({
    text: fc.nat(8).map((n) => ' '.repeat(n)),
    consecutiveUndos: fc.nat(5),
  });

  // Feature: morse-core, Property 11: Undo removes a character first, then whole words
  // Validates: Requirements 6.3, 6.4, 6.5
  it('removes a character first, then whole words, and counts every undo', () => {
    fc.assert(
      fc.property(fc.oneof(editingState, onlySpacesState), (state) => {
        const out = applyDecodeResult(state, undo);
        expect(out.event).toBeNull();
        if (state.text === '') {
          expect(out.state).toEqual({ text: '', consecutiveUndos: state.consecutiveUndos + 1 });
        } else if (state.consecutiveUndos === 0) {
          expect(out.state).toEqual({ text: state.text.slice(0, -1), consecutiveUndos: 1 });
        } else {
          expect(out.state).toEqual({
            text: expectedAfterWordUndo(state.text),
            consecutiveUndos: state.consecutiveUndos + 1,
          });
        }
      }),
      { numRuns: 200 },
    );
  });
});

describe('applyDecodeResult confirm and sos property', () => {
  // Feature: morse-core, Property 12: Confirm and SOS report an event and keep the text
  // Validates: Requirements 6.6, 6.7
  it('keeps the text, resets the undo count, and returns one matching event', () => {
    fc.assert(
      fc.property(editingState, fc.constantFrom('confirm', 'sos'), (state, action) => {
        const out = applyDecodeResult(state, { kind: 'action', action });
        expect(out.state.text).toBe(state.text);
        expect(out.state.consecutiveUndos).toBe(0);
        expect(out.event).toEqual({ kind: action });
      }),
      { numRuns: 100 },
    );
  });
});

describe('applyDecodeResult undo count reset property', () => {
  const validNonUndoResult: fc.Arbitrary<DecodeResult> = nonUndoResult.filter(
    (r) => r.kind !== 'invalid',
  );

  // Feature: morse-core, Property 13: Any valid result other than undo resets the undo count
  // Validates: Requirements 6.8
  it('resets the undo count for any character, space, confirm, or sos result', () => {
    fc.assert(
      fc.property(editingState, validNonUndoResult, (state, result) => {
        const out = applyDecodeResult(state, result);
        expect(out.state.consecutiveUndos).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});

describe('applyDecodeResult invalid property', () => {
  // Feature: morse-core, Property 14: Invalid results are reported and change nothing
  // Validates: Requirements 6.9
  it('keeps the text, resets the undo count, and reports the pattern', () => {
    fc.assert(
      fc.property(editingState, anyString, (state, pattern) => {
        const out = applyDecodeResult(state, { kind: 'invalid', pattern });
        expect(out.state.text).toBe(state.text);
        expect(out.state.consecutiveUndos).toBe(0);
        expect(out.event).toEqual({ kind: 'invalid', pattern });
      }),
      { numRuns: 100 },
    );
  });
});

describe('applyDecodeResult input immutability property', () => {
  // Feature: morse-core, Property 15: The editor does not change its input
  // Validates: Requirements 6.10
  it('leaves a deeply frozen input unchanged and returns a different state object', () => {
    fc.assert(
      fc.property(editingState, decodeResult, (state, result) => {
        const before: EditingState = { text: state.text, consecutiveUndos: state.consecutiveUndos };
        const frozenState: EditingState = Object.freeze({ ...state });
        const frozenResult: DecodeResult = Object.freeze({ ...result });

        const out = applyDecodeResult(frozenState, frozenResult);

        expect(frozenState.text).toBe(before.text);
        expect(frozenState.consecutiveUndos).toBe(before.consecutiveUndos);
        expect(frozenResult).toEqual(result);
        expect(out.state).not.toBe(frozenState);
      }),
      { numRuns: 100 },
    );
  });
});

describe('applyDecodeResult undo restore property', () => {
  // Feature: morse-core, Property 16: Undo restores the previous text
  // Validates: Requirements 6.11
  it('adding any character and then undoing once gives back the original text', () => {
    fc.assert(
      fc.property(anyString, supportedCharacter, (text, c) => {
        const added = applyDecodeResult(
          { text, consecutiveUndos: 0 },
          { kind: 'character', character: c },
        );
        const undone = applyDecodeResult(added.state, undo);
        expect(undone.state.text).toBe(text);
      }),
      { numRuns: 100 },
    );
  });
});

describe('applyDecodeResult kept text property', () => {
  // Feature: morse-core, Property 17: Results other than undo keep existing text
  // Validates: Requirements 6.12
  it('the new text starts with the old text for any result other than undo', () => {
    fc.assert(
      fc.property(editingState, nonUndoResult, (state, result) => {
        const out = applyDecodeResult(state, result);
        expect(out.state.text.startsWith(state.text)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

describe('applyDecodeResult spacing property', () => {
  // Feature: morse-core, Property 18: No leading or double spaces from any sequence
  // Validates: Requirements 6.13
  it('never has a leading space or two spaces in a row after any step', () => {
    fc.assert(
      fc.property(fc.array(decodeResult, { maxLength: 40 }), (results) => {
        let state: EditingState = EMPTY_EDITING_STATE;
        for (const result of results) {
          state = applyDecodeResult(state, result).state;
          expect(state.text.startsWith(' ')).toBe(false);
          expect(state.text.includes('  ')).toBe(false);
        }
      }),
      { numRuns: 200 },
    );
  });
});
