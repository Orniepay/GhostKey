---
inclusion: always
---

# Accessibility and user-first rules

## Why these rules exist
Ghost Key may be someone's only way to speak. Our users may have only one reliable movement, tire quickly, and lose abilities over time. Every press costs them effort. These rules come from our experience building assistive technology for nursing-home residents with ALS. A feature that breaks any rule below is not done.

## Input
1. **Every action works with one switch:** typing, undo, confirm, speak, SOS, and settings. If something can't be done with one switch, it's not finished.
2. **Never require precise timing.** All timing limits (short press, long press, pause) are adjustable and adapt to the user.
3. **No time pressure.** Nothing disappears, auto-sends, or resets because the user was slow.
4. **Every press gets instant feedback:** a visual glow, plus an optional sound.

## The user stays in control
5. **The user confirms before anything is spoken aloud or sent.** AI and autocorrect only suggest; the user decides.
6. **SOS also requires a confirm, and the confirm must be fast.** After the SOS pattern, the app shows a large "Send SOS alert?" prompt. A single press of any switch sends it; the undo pattern cancels it. The prompt never disappears on its own. The app must clearly show when an alert has been sent.
7. **Never autocorrect or change "yes" or "no".**
8. **Never change uncommon words, names, or medications** unless the user accepts a suggestion.
9. **If the AI fails or is offline, the user can still communicate** with letters, word prediction, quick phrases, and speech.

## Visual
10. **Text contrast at least 4.5:1** against its background, and **at least 3:1** for large text, icons, and button borders (WCAG 2.2 level AA).
11. **Large text by default.** Nothing important is small.
12. **Nothing flashes more than 3 times per second** (WCAG seizure-safety rule). The pumpkin glow fades in and out; it never strobes.
13. **Respect the "reduced motion" setting.** If the user's device asks for less motion (`prefers-reduced-motion`), turn animations off or make them very gentle.
14. **Calm mode** switches to a plain, high-contrast look with no Halloween effects.

## Keyboard and screen readers
15. **Everything works with a keyboard alone.** Physical switches act as keyboard keys.
16. **A clearly visible focus outline** shows which item is selected.
17. **Use real HTML elements** (`button`, `label`, headings) and give every control a clear name, so screen readers (which caregivers may use) can read the app.

## Words and tone
18. **Plain, short words in all app text.**
19. **Spooky but respectful.** The Halloween theme is for the telegraph coming back to life. Never make jokes about illness, death, or the people using the app.
