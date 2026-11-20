---
inclusion: fileMatch
fileMatchPattern: ["**/*.tsx", "**/*.css"]
---

# Design system: Ghost Key

## Two modes
- **Halloween mode (default):** a coded, cartoon-style Halloween night scene with subtle animation, pumpkin and ghost icons, and glow effects.
- **Calm mode:** a warm, paper-like light theme with no scene, no glow, and no animation. Pumpkins and ghosts become simple dot and dash marks.
- Switching modes must work with one switch (accessibility rule 1).

## Colors
All colors are CSS variables (custom properties) in `src/styles/tokens.css`. Never write a color directly inside a component. These are starting values with contrast already checked; Person 3 may change them, but every change must be re-checked against the contrast rules in `accessibility.md`.

### Halloween mode
| Token | Value | Use |
|---|---|---|
| `--bg` | #1E1830 | Page background behind the scene |
| `--panel` | #2A2340 | Solid panels behind all text and controls |
| `--text` | #F3EDE4 | Main text (14.7:1 on `--bg`) |
| `--text-muted` | #C9BFD6 | Secondary text (9.7:1 on `--bg`) |
| `--pumpkin` | #C2610A | Pumpkin icon and large headings only. Never small text (4.1:1). |
| `--ghost` | #FEFEFE | Ghost icon |
| `--glow` | #FFB547 | Lit pumpkin face, ghost glow, SOS lantern (9.7:1 on `--bg`) |

Person 3's icon colors: pumpkin #C2610A, #892402, #A23B04; mouth #BA5A33; outline #1A1400; stem #576855. Ghost cloth #FEFEFE (or #FFFFFF, to be confirmed), shadow #C7CDCE, streaks #DEE1E2, outline #202020.

### Calm mode
| Token | Value | Use |
|---|---|---|
| `--bg` | #F4EFE6 | Background |
| `--panel` | #F4EFE6 | Panels |
| `--text` | #2B2433 | Text and dot/dash marks (13.1:1) |
| `--accent` | #1F5F5B | Focus outline and selected item (6.4:1) |

## Icons
- Pumpkin = dot, ghost = dash. Every icon in the Morse chart shows a small `·` or `−` underneath.
- Final icons are SVGs drawn by Person 3, stored in `src/assets/icons/`.
- Each icon has two states: **off** (resting) and **lit** (just pressed). On the pumpkin, only the face glows (`--glow`), like a candle inside.
- Icons must stay clear at 24px (chart size) and at large sizes (the press button).
- The ghost always keeps its dark outline so it stays visible on any background.

## Telegraph tape
- A strip near the top of the screen shows the dots and dashes entered so far, drawn as small pumpkins and ghosts, with a thin divider between letters.
- In calm mode it shows plain `·` and `−` marks.
- Screen readers read the decoded letters, not every pumpkin and ghost.
- The tape sits on a solid `--panel` area, like all other content.

## Backgrounds (scenes)
- Scenes are original art, coded as React components with SVG and CSS in `src/components/scenes/`. Never copy outside images, characters, or logos.
- Each scene is built from separate layers (sky, moon, far silhouettes, middle, foreground), so any layer can be swapped for Person 3's art later.
- The MVP has one scene: a purple night with a large moon, a haunted house silhouette, glowing pumpkins, and a few bats.
- Text and controls always sit on solid `--panel` areas, never directly on scene art.

## Animation
- Only subtle motion: drifting fog, slow bats, twinkling stars, glowing that fades in and out.
- Nothing flashes more than 3 times per second.
- Animate only `transform` and `opacity` (they are smooth and light on slower computers).
- If the device asks for reduced motion (`prefers-reduced-motion`), all scene animation stops and glows switch on and off without fading.

## Placeholders for custom art
- Until Person 3's art is ready, use simple placeholder shapes.
- Mark every placeholder with the comment `PLACEHOLDER(design):` followed by what should go there, e.g. `// PLACEHOLDER(design): replace with Person 3's pumpkin SVG (off and lit states)`.
- To find every spot that still needs custom art, search the code for `PLACEHOLDER(design)`.

## Sizes
- Every clickable item is at least 24 × 24 pixels (WCAG 2.2 AA); the main press button is much larger.
- Text is large by default.

## After the MVP
- More scenes (graveyard, haunted house at sunset, pumpkin patch)
- More icon themes and themed buttons
- A theme picker in settings
