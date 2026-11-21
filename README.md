# C virus Zombies

**Active engine: Babylon.js 9** · **Build tooling: Vite** · **Android wrapper: Capacitor 8** · **Target: Android APK**

This is a browser-first 3D zombie-survival game prototype. The active project is under `web/`.

> **Important:** This project is developed with Babylon.js, not Godot. Do not follow old Godot setup instructions.

## Development

From the `web/` directory:

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

See `web/package.json` for the authoritative scripts.

## Project documents
- [AI_CONTINUITY.md](AI_CONTINUITY.md) — read first when resuming work in a new ChatGPT session.
- [MASTER_PLAN.md](MASTER_PLAN.md) — approved game vision, requirements and development phases.
- [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md) — exact implementation status, verification evidence and next checkpoint.

## Game direction
A third-person 3D zombie-survival adventure set in an explorable Pakistani city, with original heroes and zombies, enterable buildings, Pakistani vehicles, Urdu story/dialogue, mobile controls and survival progression. The complete requirements are maintained in `MASTER_PLAN.md`.

## Accuracy
Do not describe placeholder blockout meshes as final art. Do not claim browser tests, Android device validation, Capacitor native project generation or APK packaging are complete unless the relevant evidence is recorded in `DEVELOPMENT_LOG.md`.
