---
inclusion: always
---

# Tech stack: Ghost Key

## Versions on our machines
- Node.js v26.12.1
- npm 11.20.0
- Git 2.55.0
- Use **npm** only. Do not use yarn or pnpm.

## Frontend
- React with TypeScript, set up with Vite (a fast build tool for React).
- TypeScript strict mode is on in all files. Do not use `any`.
- Function components with hooks only. No class components.

## Backend
- TypeScript serverless functions hosted on Vercel, in the `api/` folder. A serverless function is a small piece of backend code that only runs when it is called.
- The backend has only these jobs:
  1. Call the AI model, so the API key is never in the browser.
  2. Send the caregiver SOS alert.
  3. (Stretch) Send messages to family.
- No database for the MVP.

## AI
- Vercel AI SDK (packages `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`), so we can switch between ChatGPT and Claude models.
- The model is chosen by an environment variable, not hard-coded.
- Every AI call has a rate limit (a maximum number of calls per minute).
- If the AI is slow, fails, or is offline, the app must still work: quick phrases, word prediction, and speech keep working without AI.

## Speech
- Use the browser's built-in Web Speech API (`speechSynthesis`) to speak messages. No paid text-to-speech service.

## Data
- Word prediction uses a public, openly licensed English word-frequency dataset. Record its source and license in the README.
- User settings (like calibration timing) are saved in the browser with `localStorage`. Nothing personal is sent to a server except AI requests and SOS alerts.

## Testing
- Vitest is the test runner (it works with Vite).
- fast-check for property-based tests (tests that try hundreds of random inputs to prove a rule always holds).
- React Testing Library with jsdom for UI tests.

## Code rules
- Core Morse logic (decoding, timing, autocorrect, undo) must be pure TypeScript functions with no UI or browser code inside, so it can be tested and works offline.
- Prefer built-in browser and Node features over adding new packages.
- Ask before adding any new dependency (package).

## Secrets
- API keys go only in environment variables: `.env.local` on our computers, and Vercel's environment settings when deployed.
- Never put API keys in code, steering files, or anything committed to Git. This repo is public.
- Keep a `.env.example` file that lists the variable names with no real values.

## Hosting
- Vercel (free tier) hosts both the website and the `api/` functions.
- Before deploying, check that Vercel supports our Node.js version.
