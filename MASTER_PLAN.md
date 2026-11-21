# C virus Zombies — Final Master Plan

**Version:** 2.1 — Owner-confirmed mandatory scope  
**Status:** Approved roadmap; development is active  
**Game target:** Android APK  
**Current prototype path:** Babylon.js browser-first 3D build  
**Repository:** https://github.com/adeeldo-ctrl/C-virus-Zombies

## 1. Game vision
Create a third-person 3D zombie-survival adventure set in an explorable Pakistani city after a virus outbreak. The player explores roads, streets and buildings, survives zombie encounters, drives vehicles, helps survivors, collects supplies and progresses through a story.

## 2. Visual quality and assets
- Original, detailed 3D human heroes, zombies, vehicles and environments.
- Realistic proportions, faces, clothing, materials, lighting, shadows and environmental detail; avoid flat vector-style presentation.
- Rigged characters with suitable idle, walk, run, jump, interaction, driving, rescue and evasion animations.
- Use original creations or assets with clear licences suitable for the intended release.
- Temporary primitive/greybox meshes are acceptable only during prototyping and must not be marked as final art.
- Optimise geometry, textures, animation and effects for Android hardware.

## 3. World and Pakistani city
- A large, explorable city with roads, intersections, streets, alleys and outdoor spaces.
- Enterable buildings: homes, shops, hospitals, police stations, warehouses, garages and malls.
- Multiple floors and rooftops where practical.
- Loot, supplies, safe areas, mission locations and distinct city districts.
- Day/night cycle and weather such as rain, fog, wind and clouds.
- World streaming/loading and performance management appropriate for mobile.

## 4. Vehicles: cars and Pakistani transport
The player should be able to approach, enter, exit and drive supported vehicles.

**Cars**
- Include a range of familiar Pakistani road cars (hatchbacks and sedans) with distinct visual designs.
- Specific make/model variants will be selected during the vehicle-art phase; do not treat unconfirmed model names as locked requirements.

**Other Pakistani transport**
- Motorcycles / bikes.
- Auto rickshaws.
- Chingchi rickshaws.
- Mini buses.
- Pakistani 4K buses.

**Vehicle systems**
- Vehicle-specific handling, acceleration, braking, steering, speed and camera behaviour.
- Engine audio, horn, headlights and brake/reverse lights.
- Vehicle condition, repair and refuelling.
- Garage, vehicle selection and practical customisation.
- Mobile touch driving controls, enter/exit interaction and collision handling.

## 5. Heroes, health and HUD
- Playable hero selection with distinct appearance and animations.
- Yellow hero health/life bar near the top of the screen.
- Health changes from gameplay damage; recovery items and low-health warning.
- Clear mission objective and interaction prompts.
- Game-over, retry and continue flow.

## 6. Zombies and AI
- Distinct normal, fast, heavy, special and boss zombie archetypes.
- Detection, pursuit, obstacle-aware navigation and varied behaviours.
- Difficulty tuned for fair mobile gameplay.
- Boss encounters with clear hazard cues, health display, obstacle navigation and escape objectives.
- Non-graphic presentation.

## 7. Gameplay and equipment
- Exploration, stealth/avoidance, rescue, obstacle navigation and survival challenges. Keep encounters non-graphic and avoid realistic weapon-use detail.
- Character movement, camera, jumping, running, interaction and context-sensitive actions.
- Equipment and inventory management.
- If weapons are included, represent them only as fictional game systems with age-appropriate, non-instructional presentation.
- Responsive feedback through animation, sound and HUD.

## 8. Story, missions and Urdu dialogue
- A connected story with mission progression and memorable characters.
- Mission types: escape infected areas, search buildings, rescue survivors, reach safe locations, find supplies/fuel and face special threats.
- Urdu character dialogue and story conversations.
- Urdu spoken mission instructions, warnings and important announcements.
- Urdu subtitles for dialogue and objectives.
- Suitable character voices and clear subtitle timing.

## 9. Inventory, survival and crafting
- Collect food, water, medicine and useful materials.
- Backpack with capacity and clear item descriptions.
- Safe-house storage and mission preparation.
- Health recovery and survival supplies.
- Optional crafting and equipment upgrades where they improve gameplay.

## 10. Safe house and progression
- Player base/safe house with storage and useful facilities.
- Restock and prepare for missions.
- Unlock upgrades and new areas.
- Save campaign progress, mission completion, inventory and unlocks.
- Reliable save/load and recovery from interrupted sessions.

## 11. Sound and music
- Quality background music and sound design.
- Urdu dialogue/voice acting.
- Zombie ambience, footsteps, environment, weather, vehicles, engines, horns, menus and mission feedback.
- Separate volume controls for music, effects and dialogue.
- Audio assets must be original or properly licensed.

## 12. Mobile controls and interface
- Third-person touchscreen controls.
- Left movement joystick and right-side camera look.
- Contextual interact, jump, run and gameplay action buttons.
- Vehicle enter/exit and driving controls.
- HUD with yellow health bar, mission objective and relevant vehicle information.
- Settings for graphics, sensitivity and audio.
- Support common Android screen sizes and aspect ratios.

## 13. Menus and settings
- Main menu: New Game, Continue, Hero Selection, Missions, Garage, Inventory/Equipment, Settings and Exit.
- Pause menu and clear mission-completion/failure screens.
- Save/load management.
- Low/Medium/High graphics presets where supported.

## 14. Technical direction and Android delivery
- Babylon.js is the active browser-first prototype path, replacing Godot as the active development route because Godot runtime/editor validation was unavailable in the previous environment.
- Keep gameplay systems modular and testable; use Babylon.js features appropriate to 3D rendering, animation, physics, audio and mobile input.
- **Android packaging route selected: Capacitor 8** as the native Android container for the Babylon.js web game. Capacitor supports adding Android to an existing web project; the Android project is managed through Android Studio and an Android SDK. See https://capacitorjs.com/docs/android and https://capacitorjs.com/docs/getting-started/environment-setup.
- Before packaging, bundle Babylon.js locally with the game assets (do not rely on the current external CDN script at runtime), configure Capacitor to use the built web directory, and add the Android platform once the browser build is stable.
- Build and test the native Android project with Android Studio/SDK; verify device performance and required native plugins before release.
- A browser build is not itself an Android APK. APK packaging, installation and device testing are mandatory final-stage tasks.
- Use efficient collision, AI, object pooling, asset loading and world streaming.
- Do not claim runtime/device testing unless it has actually been run and recorded.

## 15. Development phases and completion gates
1. **Technical foundation:** validate Babylon.js project in desktop and Android browsers; establish repeatable run/build/test workflow and decide the Android packaging route.
2. **Player foundation:** polished third-person controller, camera, movement, collisions, mobile joystick and touch look.
3. **Hero production:** original hero model, rig, materials and animation integration.
4. **Zombie gameplay:** original zombie models, animations, navigation, AI and balanced non-graphic encounters.
5. **City production:** modular Pakistani city streets, buildings, enterable interiors and world loading.
6. **Vehicles:** cars, bikes, rickshaws, Chingchi and buses; enter/exit, driving, audio, repair and fuel.
7. **Story and missions:** Urdu story, objectives, rescue/search/escape missions and boss encounters.
8. **Survival systems:** inventory, supplies, safe house, crafting/upgrades and progression.
9. **Audio and Urdu:** dialogue, voice acting, subtitles, music and sound effects.
10. **Game interface:** main menu, HUD, garage, inventory, settings and save/load.
11. **Optimisation and QA:** Android performance, controls, memory, compatibility, regression and bug fixing on target devices.
12. **Release:** package Android APK, install it on test devices, verify launch/gameplay/save/audio/controls, and record final build details.

A phase is complete only when its implementation and relevant automated/manual verification are recorded. Continue phases in order; do not skip unfinished dependencies.

## 16. Release acceptance checklist
- Player movement, camera, collisions and mobile controls work reliably.
- Hero health and HUD work correctly.
- Zombie navigation and gameplay encounters work.
- City areas and building interiors are explorable.
- All approved vehicle categories can be entered, exited and driven.
- Missions, Urdu dialogue/subtitles, inventory and progression work.
- Audio and settings work.
- Save/load survives app restart.
- Android performance, memory use, compatibility and crash checks pass on target devices.
- Final APK installs and launches successfully; final build/version is recorded.

## 17. Confirmed owner requirements
1. Title: **C virus Zombies**.
2. Detailed original 3D heroes and zombies; not flat vector-style art.
3. Explorable city streets and enterable buildings.
4. Drivable cars and Pakistani transport.
5. Bikes, auto rickshaws, Chingchi, mini buses and 4K buses.
6. Yellow hero health bar near the top.
7. Urdu voices, dialogue and mission communication with subtitles.
8. Good-quality sound and music.
9. Android APK as final delivery after development and testing.

## 18. Scope discipline and continuity
- This file is the final baseline roadmap. Preserve its requirements while implementing in phases.
- Do not silently remove approved features or call placeholder assets final.
- Specific car makes/models remain to be selected in the vehicle phase; the general requirement for drivable cars is confirmed.
- Update `DEVELOPMENT_LOG.md` after each meaningful development session with completed work, test evidence, known limitations, commit and exact next checkpoint.
- When the owner starts a new chat with **“C virus”**, read this plan and the latest development log and resume from the recorded checkpoint without asking them to repeat known requirements.
- Never claim a feature, test, phase or APK is complete unless verified.

## 19. Owner-confirmed mandatory scope — reaffirmed 2026-11-21
The owner explicitly reconfirmed the following five systems as mandatory final-game requirements. They are not optional ideas, stretch goals or features that may be silently dropped:

### 19.1 Professional graphics
- Original realistic 3D heroes and zombies.
- High-quality character models, rigging and professional animations.
- Detailed environments, materials, textures, lighting and shadows.
- Placeholder/procedural blockouts must be clearly tracked as incomplete until replaced or approved as final art.

### 19.2 Open-world Pakistani city
- A large, explorable Pakistani city with connected roads, streets and markets.
- Shops, houses and other buildings must be enterable and have proper interiors.
- The world must support meaningful exploration, not just a small isolated demo street.
- City districts, interiors, navigation, loading and mobile performance must be developed as a coherent world system.

### 19.3 Pakistani vehicle fleet
Mandatory vehicle categories:
- Motorcycles.
- Auto rickshaws.
- Chingchi rickshaws.
- Mini buses.
- Pakistani 4K buses.

Every category must have a suitable 3D vehicle, enter/exit interaction, functional driving, steering/braking, collision handling and appropriate audio. A single sedan or placeholder fleet does not satisfy this requirement.

### 19.4 Advanced zombie system
- Multiple visually distinct zombie types.
- Intelligent AI with different behaviours, detection, pursuit and obstacle-aware navigation.
- Proper character rigs and animations for idle, patrol, pursuit and gameplay reactions.
- Boss zombies and designed boss encounters.
- Spawning and difficulty progression.

### 19.5 Complete survival system
- A fictional, age-appropriate game equipment/weapon system.
- Expandable inventory and item management.
- Player health and recovery.
- Food and water survival needs, not only collectible counters.
- Item collection, storage and resource use.
- Survival resources, crafting and progression.

### 19.6 Mandatory acceptance rule
These five systems must appear in implementation tasks, phase tracking and final release acceptance. A feature is complete only when it is implemented, integrated with the rest of the game and verified. Visual placeholders, non-functional buttons, isolated mock-ups and documentation-only changes do not count as completion.

## 20. Development ownership and workflow
- The assistant is expected to work directly in the linked GitHub repository using the connected GitHub tools; do not substitute Codex prompts or ask the owner to repeat repository details.
- Inspect the latest repository state, existing code, Master Plan, development log and CI evidence before changing files.
- Implement real code and assets in coherent development batches, preserve existing working features, and commit the changes to the repository.
- Run the available integrated build/browser tests and inspect failures; update the development log with actual results and the exact next checkpoint.
- Do not stop after merely rewriting documentation. Continue implementation from the latest unfinished development checkpoint.
- Keep the approved game scope visible across sessions; never forget or silently downgrade the five mandatory systems above.
