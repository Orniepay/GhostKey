import type { DecodeResult, EditingState, EditorOutput } from './morse-types';

export const EMPTY_EDITING_STATE: EditingState = { text: '', consecutiveUndos: 0 };

function assertNever(value: never): never {
  throw new Error(`Unhandled decode result: ${JSON.stringify(value)}`);
}

function removeLastWord(text: string): string {
  return text.replace(/ +$/, '').replace(/[^ ]*$/, '');
}

function applyUndo(state: EditingState): EditorOutput {
  const { text, consecutiveUndos } = state;
  if (text === '') {
    return { state: { text: '', consecutiveUndos: consecutiveUndos + 1 }, event: null };
  }
  if (consecutiveUndos === 0) {
    return { state: { text: text.slice(0, -1), consecutiveUndos: 1 }, event: null };
  }
  return {
    state: { text: removeLastWord(text), consecutiveUndos: consecutiveUndos + 1 },
    event: null,
  };
}

export function applyDecodeResult(state: EditingState, result: DecodeResult): EditorOutput {
  switch (result.kind) {
    case 'character':
      return { state: { text: state.text + result.character, consecutiveUndos: 0 }, event: null };
    case 'action':
      switch (result.action) {
        case 'space': {
          const canAdd = state.text !== '' && !state.text.endsWith(' ');
          return {
            state: { text: canAdd ? state.text + ' ' : state.text, consecutiveUndos: 0 },
            event: null,
          };
        }
        case 'undo':
          return applyUndo(state);
        case 'confirm':
          return { state: { text: state.text, consecutiveUndos: 0 }, event: { kind: 'confirm' } };
        case 'sos':
          return { state: { text: state.text, consecutiveUndos: 0 }, event: { kind: 'sos' } };
        default:
          return assertNever(result.action);
      }
    case 'invalid':
      return {
        state: { text: state.text, consecutiveUndos: 0 },
        event: { kind: 'invalid', pattern: result.pattern },
      };
    default:
      return assertNever(result);
  }
}
