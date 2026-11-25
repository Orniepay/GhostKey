---
inclusion: fileMatch
fileMatchPattern: ["src/core/**/*.ts", "src/features/input/**/*", "src/hooks/**/*"]
---

# Morse rules: Ghost Key

## Standard
We use International Morse Code (ITU). In code, a dot is the character `.` and a dash is the character `-`. On screen, a dot is shown as a pumpkin and a dash as a ghost.

## Supported characters
| Char | Code | Char | Code | Char | Code |
|---|---|---|---|---|---|
| A | .- | N | -. | 1 | .---- |
| B | -... | O | --- | 2 | ..--- |
| C | -.-. | P | .--. | 3 | ...-- |
| D | -.. | Q | --.- | 4 | ....- |
| E | . | R | .-. | 5 | ..... |
| F | ..-. | S | ... | 6 | -.... |
| G | --. | T | - | 7 | --... |
| H | .... | U | ..- | 8 | ---.. |
| I | .. | V | ...- | 9 | ----. |
| J | .--- | W | .-- | 0 | ----- |
| K | -.- | X | -..- | . (period) | .-.-.- |
| L | .-.. | Y | -.-- | , (comma) | --..-- |
| M | -- | Z | --.. | ? (question mark) | ..--.. |

## Special codes
| Action | Code | Notes |
|---|---|---|
| Space (end word) | ..-- | Same as Gboard's Morse keyboard |
| Confirm (accept suggestion / speak message) | .-.- | Same as Gboard's enter |
| Undo | ---- | Same as Gboard's backspace. Once deletes the last letter; twice in a row deletes the last word. |
| SOS | ...---... | Entered as one continuous sequence with no letter pause. Opens the "Send SOS alert?" prompt; one press of any switch sends it, undo cancels it. |

None of the special codes is used by a supported character. Never add a character whose code matches a special code.

## When a letter is decoded
- A pattern is decoded only when the letter ends, never while it is still being entered.
- If the finished pattern matches no character or special code, show it as invalid right away and offer an autocorrect suggestion. Never silently drop a pattern.

## Input modes
- **1-switch (core):** a press shorter than the user's dash limit is a dot; a press at or above it is a dash. A pause of at least the user's letter-gap limit ends the letter. Words end with the space code `..--`.
- **2-switch:** one switch for dot, one for dash. Each switch adds its symbol once per press, when the press ends. A pause of at least the letter-gap limit ends the letter.
- **3-switch:** dot switch, dash switch, and a next-letter switch that ends the letter. Each switch acts once per press, when the press ends. No letter timing is used.
- In every mode, holding a key does not repeat the symbol: a press counts once, no matter how long it is held.

## Timing
- Default dash limit: a press of 400 ms or more is a dash.
- Default letter-gap limit: a pause of 1,500 ms or more ends the letter.
- Minimum press: a press shorter than 30 ms (adjustable) is ignored in every mode, so twitches and switch bounce add nothing.
- These defaults are only used until calibration measures the user's own short press, long press, and pause.
- After calibration, the limits keep adapting slowly to the user's recent presses (for example, when they get tired).
- The user or caregiver can always adjust every limit by hand.
- Timing settings are saved in the browser (`localStorage`).

## Reference chart
- The full chart (every supported character and every special code, drawn with pumpkins and ghosts, with a small dot or dash mark under each) is always available on screen. Users never need to memorize Morse code.
- As the user presses, the chart highlights the characters whose code still starts with what has been pressed so far, and fades the rest. Example: after a dot, every character starting with a dot stays lit; after dot-dash, only A, R, W, L, P, J, 1, and period stay lit.
