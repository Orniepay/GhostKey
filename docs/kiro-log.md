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