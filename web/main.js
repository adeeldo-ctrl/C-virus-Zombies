import {
  Engine, Scene, Color3, Color4, Vector3,
  HemisphericLight, DirectionalLight, StandardMaterial,
  MeshBuilder, FollowCamera, Scalar, TransformNode
} from "@babylonjs/core";
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import "@babylonjs/core/Meshes/Builders/groundBuilder";
import "@babylonjs/core/Meshes/Builders/sphereBuilder";
import "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import "@babylonjs/core/Meshes/Builders/capsuleBuilder";

window.BABYLON = {
  Engine, Scene, Color3, Color4, Vector3,
  HemisphericLight, DirectionalLight, StandardMaterial,
  MeshBuilder, FollowCamera, Scalar, TransformNode
};
await import("./game.js");
