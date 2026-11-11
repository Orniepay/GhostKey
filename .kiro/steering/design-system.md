---
inclusion: fileMatch
fileMatchPattern: ["**/*.tsx", "**/*.jsx", "**/*.css"]
---

# Design System: Pumpkin & Ghost

Spooky but calm. The look must never get in the way of one-switch use.
Accessibility rules live in accessibility.md and take priority over anything here.

## Symbols
- Dot = pumpkin (round). Dash = ghost (tall, wavy bottom).
- All icons are our own hand-drawn SVGs. Never use emoji, third-party icon sets, or generated icons.
- Icons live directly in `src/assets` (no icons subfolder). Expected files:
  - `pumpkin-unlit.svg`, `pumpkin-lit.svg`
  - `ghost-normal.svg`, `ghost-fading.svg`
  - `pumpkin-unlit-outline.svg`, `pumpkin-lit-outline.svg`
  - `ghost-normal-outline.svg`, `ghost-fading-outline.svg`
  - The outline versions are the plain look for calm mode.
- If an icon file is missing, show a plain labeled placeholder (a bordered box with the text "dot" or "dash"). Do not draw a new icon. Tell the user which icon is missing.
- Pumpkin and ghost must be distinguishable by shape alone, not color.
- Every icon has a text label or aria-label ("dot", "dash").

### SVG requirements
- Every icon uses `viewBox="0 0 64 64"` so swapping states never shifts the layout. Scale with CSS, not by redrawing.
- No hard-coded colors. Use `currentColor` or CSS variables so calm mode can restyle them.
- Include a `<title>` in each file.
- The glow is a separate layer in CSS, not part of the base SVG.

## Color tokens (default theme)
- --bg: #1A1423 (deep night purple)
- --text: #F5F3FA (ghost white), about 16:1 on bg
- --accent: #FF8C1A (pumpkin orange), about 7.7:1 on bg
- --focus: #FFD60A (focus highlight), about 12.7:1 on bg, always paired with a 4px outline
- Still to define before use: --surface, --danger, --success, and a text color for use on --accent. Check each pair for contrast first.
- Never use red/green as the only way to show success or error. Pair every state with an icon or text label.
- Verify all contrast ratios with a checker before relying on them.

## Typography
- Font: system sans-serif stack (or one named font)
- Body: 20px minimum. Buttons and output text: 24px minimum
- Line height: 1.5

## Components
- Buttons: minimum 64x64px target, 16px spacing between them
- The Morse key is the largest element on its screen
- Focus highlight: thick outline plus a slight scale-up, never a color-only change
- One main action per screen where possible

## Press feedback
- A registered press makes the pumpkin glow like a jack-o-lantern (soft fade-in, 200ms or longer).
- The glow never flashes, blinks, or strobes.
- Glow is a separate layer on top of the base icon, controlled in CSS.
- Feedback must not rely on color alone: pair the glow with an outline or scale change.

## Morse tree
- Displayed on screen as a spooky tree.
- The current position is highlighted with an outline, not just color.
- It is a visual aid, not required for use.
- It has a text alternative for screen readers, such as the current dot/dash path and letter.

## Undo
- Undo pattern = four ghosts (dash dash dash dash).
- The last letter fades out slowly. It never disappears suddenly.

## Lantern SOS (caregiver screen)
- Default is a steady lantern-style glow. A slow fade in and out is allowed only when motion is allowed.
- No rapid pulsing. We use zero flashes, well under 3 changes per second.
- Always show a large text message ("SOS: needs help") so the alert never relies on color or glow alone.
- With prefers-reduced-motion, switch to a static high-contrast banner.

## Motion
- No flashing or blinking, ever.
- Transitions: 200ms or longer, ease-in-out, subtle only.
- Respect prefers-reduced-motion.

## Calm mode (plain, high-contrast, for daily use)
- Toggle: one always-visible switch with a clear label, usable with one switch, remembered between sessions.
- Palette: --bg #000000, --text #FFFFFF, --accent #FFD60A
- Uses the plain outlined icon versions.
- All animation and glow off, no decorative elements.
- Same layout and controls as the default theme.

## Don'ts
- No flashing highlights
- No tiny or low-contrast text
- No sound-only or color-only feedback
- No hover-only interactions (one-switch users can't hover)
- No emoji or non-project icons
