---
inclusion: auto
name: ai-expansion
description: Rules for AI phrase expansion, AI prompts, the api/ functions that call AI models, rate limits, timeouts, and offline fallback. Use when creating or changing any AI feature.
---

# AI phrase expansion: Ghost Key

## What it does
Turns short Morse input into full sentence suggestions. Example: "WTR PLS" becomes "Could I have some water, please?"

## Rules
- AI only suggests. Show up to 3 suggestions. The user picks one with the confirm code, or keeps their own text.
- Never send or speak anything automatically.
- Keep the user's meaning. Never add facts, feelings, or requests the user did not type. If unsure, suggest the closest literal sentence.
- Never expand or change "yes" or "no".
- Write short, plain, first-person sentences with correct punctuation.

## How it is built
- AI calls happen only in `api/` serverless functions. API keys live only in environment variables.
- The provider and model are set by the environment variables `AI_PROVIDER` and `AI_MODEL`, using the Vercel AI SDK.
- Use small, fast models to keep cost and wait time low.
- Timeout: if there is no answer within 5 seconds, stop waiting and show the user's own text and quick phrases instead.
- Rate limit every client so judges or anyone else can't run up the bill. The exact method is decided in the AI feature spec.

## Privacy
- Send only the current message text. Never send message history or personal details.
- Never log or store message text on the server.

## Testing
- Tests use a fake (mock) AI. Never call a real AI model in tests.