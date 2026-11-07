---
inclusion: always
---

# Product: Ghost Key

## What it is
Ghost Key is a web app that brings Morse code back to life as a voice for people who cannot speak or type. It is our entry for the Kiroween 2026 hackathon in the Resurrection category (bringing a dead technology back to life).

## Who it is for
- People with ALS, stroke, spinal cord injury, or other conditions that take away speech and typing.
- Many of them can only control one reliable movement (for example, one finger or a small head movement), and that movement can get weaker over time.
- Caregivers and family members who need to understand them quickly.

## Why we are building it
Before this hackathon, two of our team members worked as student software engineers on a university project building assistive technology for nursing-home residents with ALS. Their communication tools were slow: they waited while letters were highlighted one at a time. Ghost Key is designed to be much faster, and to keep working as a person's abilities change.

Never use real client names, facility names, or patient details anywhere in the code, docs, or demo.

## Core idea
- **1-switch Morse is the core of Ghost Key.** One button: a short press is a dot (shown as a pumpkin), a long press is a dash (shown as a ghost). Every feature is designed for 1-switch first.
- Timing adapts to each user. A short calibration measures their own short press, long press, and pause, and the limits keep adjusting as they get tired.
- 2-switch and 3-switch modes are also main features, for users with more than one reliable movement.
- AI turns a few letters into full sentences. The user always confirms before anything is spoken or sent.

## MVP features (must ship)
1. 1-switch Morse input with calibration and adaptive timing
2. 2-switch and 3-switch input modes
3. Morse decoder with property-based tests
4. Morse-aware autocorrect (fixes swapped dots and dashes and timing mistakes)
5. Word prediction using a public word-frequency dataset
6. AI phrase expansion with user confirmation
7. Speak messages aloud
8. Undo (four dashes), caregiver SOS alert, and calm mode
9. A live website that judges can use with no login

## Stretch features (only after the MVP works)
- 1-switch scanning mode
- Text or email messages to family

## Not building
- No native iOS or Android app yet (future plans).
- No accounts or logins. Judges must be able to use it right away.
- Not a medical device. The SOS alert adds a fast way to get help; it does not replace a facility's call system or emergency services.

## How we are different
- Existing Morse keyboards (like Gboard's) use separate dot and dash keys and are only keyboards.
- Ghost Key works with a single button with timing that adapts to the user, corrects Morse-specific mistakes, expands short input into full sentences, speaks out loud, and can alert a caregiver.

## Tone and theme
- Halloween theme: pumpkin = dot, ghost = dash, lantern glow = SOS.
- Spooky but respectful. The "ghost" is the telegraph coming back to life, never the people using the app.

## How we measure success
- Fewer button presses per message than plain Morse code.
- Every feature can be used with one switch.
- Judges can use every MVP feature at the live URL.
