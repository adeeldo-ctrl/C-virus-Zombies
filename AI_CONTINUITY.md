# C virus Zombies — AI Continuity / Start Here

**Purpose:** This file exists so future ChatGPT sessions resume the real project without asking the owner to repeat the repository, engine, workflow or project requirements.

## Non-negotiable project identity
- Project/game title: **C virus Zombies**
- GitHub repository: https://github.com/adeeldo-ctrl/C-virus-Zombies
- Repository slug: `adeeldo-ctrl/C-virus-Zombies`
- Main branch: `main`
- Active engine: **Babylon.js 9**
- Build/dev tooling: **Vite**, with the browser game source under `web/`
- Android packaging target: **Capacitor 8**
- Final delivery target: **Android APK**
- **Do not use Godot. Godot is not the active engine and must not be proposed as the current workflow.** An old README previously described a Godot prototype; that description is obsolete and has been corrected.

## Required resume procedure
Whenever the owner starts a chat with **“C virus”**:
1. Open this file first.
2. Read `MASTER_PLAN.md` and `DEVELOPMENT_LOG.md`.
3. Inspect the latest commit on `main` and the latest relevant GitHub Actions workflow run. At the last checkpoint, specifically verify run `44814206896` before assuming its browser tests passed.
4. Continue from the exact unfinished checkpoint in `DEVELOPMENT_LOG.md`; do not restart completed work.
5. Use the connected GitHub tools to inspect and modify this repository directly when requested. Do not ask the owner to repeat the repository name or provide a local project folder/screenshot when repository access is sufficient.
6. After meaningful implementation, update `DEVELOPMENT_LOG.md` with changes, actual verification evidence, limitations, commit/run references and the next exact task.

## Current verified project direction
The approved plan describes a third-person 3D zombie-survival adventure in an explorable Pakistani city. Preserve the requirements in `MASTER_PLAN.md`, including original detailed heroes/zombies, enterable buildings, Pakistani transport and drivable vehicles, a yellow hero health bar, Urdu dialogue/voice/subtitles, sound/music, mobile controls, survival systems, missions and Android APK delivery.

## Last recorded development checkpoint (2026-11-21, mission-flow update)
Read `DEVELOPMENT_LOG.md` for the authoritative full details. The owner has explicitly instructed: complete the entire game first, fix genuine errors as encountered, do not build the APK until the game work is complete, and avoid unnecessary/repeated testing. Keep only essential build/integration/regression checks. Summary:
- Phase 1 (technical foundation): still in progress; Vite production build passed in GitHub Actions run `44814206896`, but the desktop/mobile Chromium smoke test was still running when the log was written. Check its final conclusion before claiming success.
- Phase 2 (player foundation): in progress; third-person camera/controller, collision movement, sprint/stamina, jump, joystick, touch actions and camera look are implemented but not signed off.
- Phase 3 (hero production): a procedural modular hero blockout and walk cycle exist; this is not final-quality art.
- Real Android device/browser validation has not been performed.
- Capacitor config exists, but the native `android/` project has not yet been generated in an Android SDK environment.
- No APK has been built.
- Current mission now requires all four supplies before safe-zone completion; early arrival reports the remaining crate count. Mission-complete state is persisted; end overlays offer a replay action that clears the local save.
- Zombie models, full city, vehicles, story, Urdu voice acting, full audio, inventory and final menus remain unfinished.

## Latest implementation update (2026-11-21)
- Fixed the safe-zone objective gate so the mission completes only after all four supply crates are collected.
- Saved/restored the mission-complete flag and added mission complete/fail overlays with Play Again reset.
- Commits: `63d7771aa9090b01891d5cb15f58133f8fc3ca08`, `739ee0d4a0cad0d679233da0cba7d8155a2c6f12`, `95a390b99cc91fc3e51215630abb8c9b70ecc2e8`.
- No additional browser/device tests were run for this small continuation; do not claim the latest code is verified by CI.

## Important source locations
- `web/index.html` — game HUD (health, stamina, supplies), pause overlay and touch UI
- `web/style.css` — responsive HUD, supply counter, pause overlay, joystick and action controls
- `web/game.js` — Babylon scene, player controller, detailed hero blockout, articulated walker prototypes, supply pickups, local save, pause/resume, pursuit and safe-zone objective
- `web/main.js` — modular Babylon imports and gameplay bootstrap
- `web/package.json` — Vite, Babylon.js, Playwright and Capacitor dependencies/scripts
- `web/vite.config.js` — production build and relative asset base
- `web/capacitor.config.json` — Android wrapper configuration
- `web/smoke-test.cjs` — desktop/mobile Chromium checks
- `.github/workflows/validate-prototype.yml` — build and browser-test workflow

## Owner workflow preferences
- Work directly in the existing GitHub repository; repository context and progress should be recovered from these files.
- Do not repeatedly ask the owner to explain the project or repository.
- Do not switch engines or rewrite the project in another engine.
- Continue in consolidated, useful implementation chunks; keep the development log current.
- Never claim tests, phases, Android packaging or APK delivery are complete without evidence.

## Source of truth and conflict rule
- `MASTER_PLAN.md` is the product requirements and roadmap source of truth.
- `DEVELOPMENT_LOG.md` is the current implementation/progress source of truth.
- This file is the session-resumption and workflow guardrail.
- If an older file, comment or generated note says Godot, treat it as stale unless the owner explicitly changes the engine. The active engine remains Babylon.js.
