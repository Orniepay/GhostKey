# Kiro usage log: Ghost Key

How we used Kiro while building Ghost Key for Kiroween 2026. Newest entries at the bottom.

## Entry format
- **Date**
- **Kiro feature** (steering, spec, hook, MCP, custom agent, power, checkpoint, IDE / Web / CLI)
- **What we did**
- **What worked / what didn't**
- **Credits used** (if shown)
- **Screenshot** (file in `docs/screenshots/`, if any)

---

## 2026-11-06 to 2026-11-07: Setting up steering
- **Kiro feature:** Steering (workspace scope)
- **What we did:** Wrote steering by hand instead of using "Generate Steering Docs," because the repo was empty and there was nothing for Kiro to analyze. Planned our steering files around Kiro's inclusion modes (always, fileMatch, auto, manual), so Kiro only loads what is relevant to the task.
- **What worked / what didn't:** Kiro showed our files under "Workspace," separate from "Global." We first named the folder `Steering` with a capital S. It worked on Windows, but Linux (Kiro Web's cloud sandbox and our hosting) treats capitals as different names, so we renamed everything to lowercase.

## 2026-11-07 to 2026-11-18: Steering content
- **Kiro feature:** Steering
- **What we did:** Added `product.md`, `tech.md`, `structure.md`, and `accessibility.md` (always loaded), `morse-rules.md` and `testing-standards.md` (fileMatch), and `ai-expansion.md` (auto). `structure.md` uses a file reference (`#[[file:package.json]]`) so Kiro always sees our current scripts and packages.
- **What worked / what didn't:** Copying markdown from a chat added an extra wrapper line above the front matter in one file, which would have stopped Kiro from reading the inclusion setting. Front matter must be the very first line. We now check the first line of every steering file.

## 2026-11-18 to 2026-11-20: Finishing steering
- **Kiro feature:** Steering
- **What we did:** Added `design-system.md` (fileMatch on `.tsx` and `.css`): colors as CSS variables with checked contrast, Halloween and calm modes, layered coded scenes, and a `PLACEHOLDER(design):` comment convention so we can find every spot that still needs custom art.
- **What worked / what didn't:** Dropped a submission-checklist steering file, because steering should guide how Kiro writes code, not hold our to-do list.
- **Screenshot:** `docs/screenshots/2026-11-20-steering-panel.png`, `docs/screenshots/2026-11-20-steering-filematch.png`, `docs/screenshots/2026-11-20-steering-auto.png`

## 2026-11-21: Steering test
- **Kiro feature:** Steering
- **What we did:** Asked Kiro, in a new session and without reading any files, to list the rules it follows for this project.
- **What worked / what didn't:** Kiro loaded exactly our four "always" files (accessibility, product, structure, tech). It did not load the fileMatch files, and it knew ai-expansion existed but didn't load it, so the auto mode worked as designed. The test also exposed a gap: Kiro said it would not add tests unless asked, because testing-standards.md only loads for test files. We fixed it by adding an always-loaded rule to tech.md that makes tests required for all core logic.
- **Credits used:** 0.26
- **Screenshot:** `docs/screenshots/2026-11-21-steering-test.png`

## 2026-11-22: morse-core spec, requirements
- **Kiro feature:** Feature spec (Requirements-First), Analyze Requirements
- **What we did:** Started the morse-core spec from a one-line prompt that pointed Kiro at morse-rules.md and testing-standards.md. Kiro read our always-on steering, wrote requirements.md in EARS format, then refined it with a detailing pass that added exact, testable counts (39 characters, 43 chart entries, 9 matches for ".-"). It asked before installing vitest and fast-check, as our tech.md rule requires.
- **What worked / what didn't:** Our own review caught a product problem: the refined rule let "space" add a space to an empty message or after another space, which wastes presses for a 1-switch user. We changed it and added a property that the message never starts with a space or has two spaces in a row. Kiro caught a glossary gap itself (the invalid event). Analyze Requirements then found 0 issues: it checks logic, not what is best for our users, so human review is still needed.
- **Credits used:** 5.52 (requirements) + 0.92 (glossary fix) + 0.69 (analysis), plus the 3-change round
- **Screenshot:** `docs/screenshots/2026-11-22-analyze-requirements.png`