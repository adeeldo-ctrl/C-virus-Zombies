# Browser prototype (Babylon.js)

This is the active browser-first 3D prototype for C virus Zombies. It does not require the Godot editor.

## Run locally
Serve this `web` folder with any static HTTP server and open `index.html` through that server. Babylon.js is loaded from its official CDN, so an internet connection is required.

Example from the repository root with Python installed:

```bash
python -m http.server 8000 --directory web
```

Then open `http://localhost:8000`.

## Controls
- Desktop: WASD or arrow keys to move.
- Desktop/mobile camera: drag the right side of the game screen to look around.
- Touch: use the left on-screen joystick to move.
- Objective: avoid the walkers and reach the green safe zone.

## Automated browser check
GitHub Actions runs `web/smoke-test.cjs` using Playwright and Chromium. It checks scene loading, the five walker entities, keyboard forward movement, safe-zone completion, mobile viewport startup, touch joystick movement, right-side camera-look input and browser/page errors.

## Current limitations
This is a technical greybox prototype, not final game art. Characters and buildings are generated primitive meshes. A complete city, enterable interiors, finished hero/zombie models and animations, cars and Pakistani transport, story, Urdu voice acting, full sound design, inventory, saving, and Android APK are not implemented yet. Browser emulation does not replace testing on a real Android device.
