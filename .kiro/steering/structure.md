---
inclusion: always
---

# Project structure: Ghost Key

## Folder layout

ghost-key/
├── .kiro/ Kiro setup: steering, specs, hooks, and other Kiro settings
├── api/ Vercel serverless functions (backend), e.g. AI expansion and SOS alert
├── docs/ Our notes, including the Kiro usage log for the write-up
├── public/ Files served as-is (favicon, icons, the word-frequency dataset)
├── src/
│ ├── main.tsx App entry point
│ ├── App.tsx Main screen
│ ├── core/ Pure TypeScript logic. No React, no browser code.
│ │ ├── morse/ Morse alphabet, decoder, timing calibration, undo
│ │ ├── autocorrect/ Morse-aware autocorrect
│ │ └── prediction/ Word prediction
│ ├── features/ Screens and feature UI (input, compose, sos, settings)
│ ├── components/ Shared UI pieces used by more than one feature
│ ├── hooks/ Custom React hooks (e.g. reading switch presses)
│ ├── services/ Code that talks to the outside: speech, AI API calls, browser storage
│ ├── styles/ Shared CSS (colors, calm mode)
│ └── assets/ Images and icons
├── .env.example Names of required environment variables, no real values
├── .gitattributes Forces LF line endings
├── .gitignore
├── LICENSE MIT
└── README.md

## Where code goes
- Anything that decides *what a press means* (dot or dash, which letter, undo, timing, autocorrect, prediction) goes in `src/core/`, never inside a React component.
- React components only display things and pass user actions to `core/` or `services/`.
- Anything that talks to something outside the app (AI API, speech, localStorage, network) goes in `src/services/`.
- Backend code goes only in `api/`.

## Naming
- React component files: PascalCase, e.g. `MorseKey.tsx`, `SosButton.tsx`.
- All other TypeScript files: kebab-case, e.g. `morse-decoder.ts`, `timing-calibration.ts`.
- Folders: lowercase kebab-case.
- Steering and docs files: lowercase kebab-case, e.g. `morse-rules.md`.
- Imports must match file names exactly, including capital letters, because our hosting runs on Linux, where capitals matter.

## Tests
- Each test file sits next to the file it tests, with the same name plus `.test`: `morse-decoder.ts` → `morse-decoder.test.ts`.
- Property-based tests also go in the `.test.ts` file next to the code.

## Exports
- Use named exports (`export function decode...`), not default exports, except where a tool requires a default export.

## Current commands and packages
#[[file:package.json]]
