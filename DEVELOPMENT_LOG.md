# C virus Zombies — Development Log

**Last updated:** 2026-11-21  
**Repository:** https://github.com/adeeldo-ctrl/C-virus-Zombies  
**Branch:** `main`  
**Active engine:** Babylon.js (browser-first 3D)  
**Final target:** Android APK

## Current checkpoint
- **Active phase:** Phase 1 — technical foundation and runtime validation.
- **Current playable slice:** generated 3D street, third-person follow camera, desktop keyboard movement, mobile joystick and camera-look input, five simple pursuing walkers, yellow health bar, and green safe-zone objective.
- **Automated desktop browser smoke test:** passed on Chromium. It confirmed the Babylon scene loads, five walkers spawn, forward keyboard movement works, the safe-zone objective completes, and no browser/page errors are reported.
- **Mobile touch smoke test:** an extended test now emulates a 390×844 touch device and checks joystick movement and right-side camera look. GitHub Actions run is in progress; its result must be checked before this test is marked passed.
- **Real Android phone/browser test:** not performed in this environment.
- **Android APK:** not built.
- **Art status:** all current characters/buildings are temporary generated greybox meshes; no final-quality assets are complete.

## Work completed in the current session
1. Finalised `MASTER_PLAN.md` v2.0 as the project baseline, including drivable cars plus bikes, auto rickshaws, Chingchi, mini buses and Pakistani 4K buses.
2. Confirmed Babylon.js as the active browser-first path; earlier Godot files remain archived/secondary and are not the active build.
3. Corrected forward movement so the forward key moves toward the safe-zone objective.
4. Added terminal-state handling so movement and walker pursuit stop after safe-zone completion or health depletion.
5. Added GitHub Actions validation for JavaScript syntax and required web files; source-validation workflow passed.
6. Added a Playwright/Chromium browser smoke test. Desktop gameplay smoke test passed.
7. Extended the smoke test to cover emulated mobile touch joystick and camera-look controls. The latest CI result is pending at the time of this log update.

## Earlier project history
- A Godot 4 starter was committed first (`project.godot`, initial scenes and scripts). It remains in the repository as a secondary/archived experiment because a Godot runtime/editor validation environment was unavailable.
- The active prototype was moved to `web/` using Babylon.js. This is still a greybox technical prototype, not the finished game.

## Remaining work — ordered
1. Finish Phase 1: obtain a passing desktop + emulated-mobile browser smoke test; resolve failures; document how to run the browser build; choose and validate an Android packaging route. A real Android device check remains required when a device/build environment is available.
2. Phase 2: robust player controller, camera, movement, collision and mobile controls.
3. Phase 3: original hero model, rig, materials and animation.
4. Phase 4: original zombie models, animations, navigation and non-graphic AI encounters.
5. Phase 5: modular Pakistani city, enterable buildings/interiors and world loading.
6. Phase 6: drivable cars, bikes, auto rickshaws, Chingchi, mini buses and 4K buses; enter/exit, driving, audio, fuel and repair.
7. Phase 7: story, Urdu dialogue/subtitles and missions.
8. Phase 8: inventory, survival supplies, safe house and progression.
9. Phase 9: Urdu voice acting, music and sound effects.
10. Phase 10: menus, HUD, garage, settings and save/load.
11. Phase 11: Android optimisation, compatibility, regression and device QA.
12. Phase 12: package, install and verify the Android APK.

## Continuity instructions
When the user says **“C virus”** in a new chat:
1. Read this file and `MASTER_PLAN.md` from the repository.
2. Check the latest GitHub Actions run and repository commits.
3. Resume at the exact current phase and unfinished item above; do not restart completed work or ask the user to repeat confirmed requirements.
4. Update this log after meaningful work and before ending the session.

## Accuracy rules
- Do not call greybox assets final art.
- Do not mark mobile/device testing complete based only on desktop tests or browser emulation.
- Do not claim Android APK creation, installation or device testing until actually verified.
- Skip redundant tests; retain focused automated checks that validate real gameplay and release requirements.
