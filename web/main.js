import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { FollowCamera } from "@babylonjs/core/Cameras/followCamera";
import { Scalar } from "@babylonjs/core/Maths/math.scalar";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Ray } from "@babylonjs/core/Culling/ray";
import "@babylonjs/core/Collisions/collisionCoordinator";
import "@babylonjs/core/Culling/ray";
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import "@babylonjs/core/Meshes/Builders/groundBuilder";
import "@babylonjs/core/Meshes/Builders/sphereBuilder";
import "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import "@babylonjs/core/Meshes/Builders/capsuleBuilder";

window.BABYLON = {
  Engine, Scene, Color3, Color4, Vector3,
  HemisphericLight, DirectionalLight, SpotLight, StandardMaterial,
  MeshBuilder, FollowCamera, Scalar, TransformNode, Ray
};
await import("./game.js");
