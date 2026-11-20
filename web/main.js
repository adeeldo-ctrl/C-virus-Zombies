import {
  Engine,
  Scene,
  Color3,
  Color4,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  StandardMaterial,
  MeshBuilder,
  FollowCamera,
  Scalar,
  TransformNode
} from "@babylonjs/core";

// Expose only the Babylon APIs used by the gameplay module.
window.BABYLON = {
  Engine, Scene, Color3, Color4, Vector3,
  HemisphericLight, DirectionalLight, StandardMaterial,
  MeshBuilder, FollowCamera, Scalar, TransformNode
};
await import("./game.js");
