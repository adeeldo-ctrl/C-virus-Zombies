# C virus Zombies — Babylon.js + Capacitor

The active game is a browser-first Babylon.js 3D project. Vite bundles Babylon.js locally for offline-capable runtime assets; Capacitor is configured as the Android native wrapper.

## Requirements
- Node.js 22+
- npm
- For Android packaging: Android Studio, Android SDK and a supported JDK

## Run the development build
From this `web` directory:

```bash
npm install
npm run dev
```

Open the local Vite address printed by the command. Babylon.js is loaded from the local npm bundle, not a remote CDN.

## Build and preview
```bash
npm run build
npm run preview
```

The production web bundle is generated in `dist/`.

## Android wrapper
Capacitor configuration is in `capacitor.config.json` and points to `dist/`.

After installing Android Studio and the Android SDK:

```bash
npm install
npm run build
npm run android:add
npm run android:sync
npm run android:open
```

Build the APK from Android Studio. The generated `android/` native project is intentionally not claimed to exist until the Android platform is added in an Android SDK environment. A real device install and test are still required before release.

## Controls
- Desktop: WASD / arrow keys to move, Shift to sprint, Space to jump.
- Touch: left joystick to move, RUN to sprint, JUMP to jump.
- Camera: drag the right side of the screen to rotate; drag vertically to adjust camera height. Mouse wheel zooms on desktop.
- Objective: avoid the walkers and reach the green safe zone.

## Automated browser tests
`npm run test:browser` uses Playwright and Chromium. It checks production bundle startup, scene readiness, five walker entities, hero model parts and walk cycle, keyboard movement, sprint and stamina drain, jump, street-boundary collision, safe-zone completion, mobile joystick, mobile camera look, mobile jump and browser/page errors. GitHub Actions builds the production bundle before running this test.

## Current limitations
This remains a gameplay prototype. The current hero is an original modular mesh blockout with procedural walk-cycle motion, not final-quality scanned/artist-finished character art. Zombie models are still simple placeholders. A complete Pakistani city and enterable interiors, polished hero/zombie assets, vehicles, story, Urdu dialogue/voice acting, full sound, inventory, save/load, Android project generation, APK and physical Android device testing remain unfinished.
