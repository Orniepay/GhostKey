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
- Users never need to memorize Morse code. The full chart is always on screen.
- AI turns a few letters into full sentences. The user always confirms before anything is spoken or sent.

## MVP features (must ship)
1. 1-switch Morse input with calibration and adaptive timing
2. Hold-progress ring: while the switch is held, a ring fills around the pumpkin, and it turns into the ghost once the hold passes the dash limit
3. 2-switch and 3-switch input modes
4. Morse decoder with property-based tests
5. On-screen Morse chart with a small dot or dash mark under each pumpkin and ghost, which highlights the characters that still match what the user has pressed so far
6. Morse-aware autocorrect (fixes swapped dots and dashes and timing mistakes)
7. Word prediction using a public word-frequency dataset
8. AI phrase expansion (up to 3 suggestions) with user confirmation
9. Speak messages aloud, plus a one-press "say it again"
10. Undo (four dashes), caregiver SOS alert with a one-press confirm, and calm mode
11. "Presses saved" counter: shows how many presses a message took compared with plain Morse code
12. Guided "Try it" start screen for first-time users and judges, showing which keys to press and an example to try
13. A live website that judges can use with no login

## After the MVP works (in this order)
1. Calibration as a short game ("tap the pumpkin 5 times, hold the ghost 5 times")
2. "Show to caregiver" view: the finished message fills the screen in large text
3. Learns my phrases: sentences the user sends often are offered first, saved only in their browser
4. 1-switch scanning mode
5. Text or email messages to family

## Not building
- No native iOS or Android app yet (future plans).
- No accounts or logins. Judges must be able to use it right away.
- Not a medical device. The SOS alert adds a fast way to get help; it does not replace a facility's call system or emergency services.

## How we are different
- Existing Morse keyboards (like Gboard's) use separate dot and dash keys and are only keyboards.
- Ghost Key works with a single button with timing that adapts to the user, shows exactly when a press becomes a dash, corrects Morse-specific mistakes, expands short input into full sentences, speaks out loud, and can alert a caregiver.

## Tone and theme
- Halloween theme: pumpkin = dot, ghost = dash, lantern glow = SOS.
- Spooky but respectful. The "ghost" is the telegraph coming back to life, never the people using the app.

## How we measure success
- Fewer button presses per message than plain Morse code, shown live by the "presses saved" counter.
- Every feature can be used with one switch.
- Judges can use every MVP feature at the live URL.