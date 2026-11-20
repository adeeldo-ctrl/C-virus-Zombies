# Browser prototype (Babylon.js)

This is the active browser-first 3D prototype for C virus Zombies. It does not require the Godot editor.

## Run locally
From the repository root, serve the `web` folder with Python:

```bash
python -m http.server 8000 --directory web
```

Open `http://localhost:8000`. Babylon.js is loaded from its official CDN, so an internet connection is required.

## Controls
- Desktop movement: WASD or arrow keys.
- Desktop sprint: hold Shift while moving.
- Desktop jump: press Space.
- Touch movement: use the left on-screen joystick.
- Touch sprint: hold RUN.
- Touch jump: tap JUMP.
- Camera: drag the right side of the screen; vertical dragging adjusts camera height.
- Objective: avoid the walkers and reach the green safe zone.

## Automated browser check
GitHub Actions runs `web/smoke-test.cjs` with Playwright and Chromium. It checks scene loading, five walker entities, keyboard movement, sprint, jump, street-boundary collision, safe-zone completion, mobile viewport startup, touch joystick movement, camera-look input, touch jump and browser/page errors.

## Current limitations
This is a technical greybox prototype, not final game art. Characters and buildings are generated primitive meshes. A complete city, enterable interiors, finished hero/zombie models and animations, cars and Pakistani transport, story, Urdu voice acting, full sound design, inventory, saving and Android APK are not implemented yet. Browser emulation does not replace testing on a real Android device.
