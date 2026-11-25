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

## 2026-11-22: morse-core spec, design
- **Kiro feature:** Feature spec (design phase), Correctness (property-based testing)
- **What we did:** Kiro wrote design.md: seven small pure TypeScript modules, errors returned as values instead of thrown, and 18 correctness properties, each linked to the requirements it validates, plus a coverage map for every requirement. We reviewed it and asked for 3 changes.
- **What worked / what didn't:** Our review found 3 issues. (1) The character type was a plain string, so a wrong character would only be caught by tests; we asked for a strict type built from one list, so mistakes fail while coding. (2) The "no browser code" scan could fail on words in comments; it now strips comments, matches whole words, and checks itself. (3) The build could not type-check test files that read files with Node; Kiro added a separate TypeScript config for tests instead of weakening strict mode, and noticed our app config never stated strict mode explicitly.
- **Credits used:** 4.29 (design) + 6.69 (changes)
- **Screenshot:** `docs/screenshots/2026-11-22-design-properties.png`

## 2026-11-23: morse-core spec, running the tasks
- **Kiro feature:** Spec task execution (Run All Tasks with parallel waves), sub-agents, property-based testing, Autopilot
- **What we did:** Ran all 53 required tasks with Run All Tasks. Kiro grouped independent tasks into parallel waves and ran each task in its own sub-agent. It wrote seven pure TypeScript modules in src/core/morse/, a separate TypeScript config so the build type-checks tests, and 111 tests: unit tests, a purity test, and 20 property-based tests covering all 18 design properties, each with at least 100 runs. All four checkpoints passed, and the final check ran npm test, npm run lint, and npm run build.
- **What worked / what didn't:** No test failed during the run, and no property test found a bug in this module. We credit that to reviewing and fixing the requirements and design before any code was written. Kiro's final check confirmed each property test exists, is tagged, and runs 100+ times, but said it did not compare each test's assertions with its property, so we ran a separate check for that.
- **Credits used:** 51.14 (about 1 hour 11 minutes)
- **Screenshot:** `docs/screenshots/2026-11-23-tests-passing.png`, `docs/screenshots/2026-11-23-design-properties-implemented.png`

## 2026-11-23: Checking property tests against their properties
- **Kiro feature:** #spec context in chat, property-based testing
- **What we did:** Started a new session with #spec:morse-core and asked Kiro to compare each of the 18 property tests with its property in design.md, without changing files. Then had it fix the gaps, changing only test files.
- **What worked / what didn't:** 14 tests matched. 4 differed, even though all passed: Property 8 only generated printable ASCII, so it tested less than it claimed; Property 4 never guaranteed its random inputs hit real Morse patterns; Property 5 ran outside its stated 0 to 100 range and rarely tried tricky letters like "ı" and "ſ"; Property 7 had one redundant check. We fixed the first three and left the fourth. The stronger tests still passed, so no source bug was found. Lesson: a passing property test is only as good as its input generator. A spec session only runs work through tasks, so Kiro reopened the final checkpoint task to run this fix; small fixes outside the task list fit better in a regular chat.
- **Credits used:** 1.74 (review) + 4.03 (fixes)

## 2026-11-25: switch-input spec, requirements
- **Kiro feature:** Feature spec (Requirements-First), Analyze Requirements
- **What we did:** Started the switch-input spec: 1-, 2- and 3-switch timing, hold progress for the halo, calibration, and adaptive timing, all as pure logic with no clock inside (the app passes in timestamps). Kiro wrote the requirements in EARS form and listed the choices it made where our prompt was silent.
- **What worked / what didn't:** Our review caught a real-world bug before any code: in 2- and 3-switch mode, holding a keyboard key repeats the key-down event, which would have typed several dots per press. Every mode now counts a press once, on release, with a minimum press length. We also found that recalibrating kept old presses that would pull the new timing back, so a successful calibration now clears them. The first Analyze run skipped the adaptive timing section and reported 0 issues, so we did not treat it as a pass. The second run found a real contradiction: a press that ended before it started was treated as 0 ms, which would count as a dot if the minimum press was set to 0. It is now always ignored. Kiro's first edit script failed because it named a helper function R, which PowerShell already uses to re-run commands; it renamed the function and retried.
- **Credits used:** 6.58 + 3.08 + 0.79 + 1.45 + 3.17 (requirements, changes, two analyses)
- **Screenshot:** `docs/screenshots/2026-11-25-switch-input-analyze.png`