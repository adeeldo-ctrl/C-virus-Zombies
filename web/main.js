import * as BABYLON from "@babylonjs/core";

// Keep the existing gameplay module global API while bundling Babylon locally.
window.BABYLON = BABYLON;
await import("./game.js");
