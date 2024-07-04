import * as THREE from "three";
import GUI from "lil-gui";

export function addGui(object: THREE.Object3D, name = "") {
  const gui = new GUI();

  gui.add(object.position, "x").name(name + " pos x");
  gui.add(object.position, "y").name(name + " pos y");
  gui.add(object.position, "z").name(name + " pos z");

  gui
    .add(object.rotation, "y")
    .name(name + " rot y")
    .min(0)
    .max(Math.PI * 2)
    .step(0.001);

  gui.add(object.scale, "x").name(name + " scale x");
}

export function getLargestAbsoluteEntries(a: THREE.Vector3, b: THREE.Vector3) {
  const x = Math.abs(Math.max(Math.abs(a.x), Math.abs(b.x)));
  const y = Math.abs(Math.max(Math.abs(a.y), Math.abs(b.y)));
  const z = Math.abs(Math.max(Math.abs(a.z), Math.abs(b.z)));

  return new THREE.Vector3(x, y, z);
}
export function randomId(length: number = 5) {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV0123456789";

  let id = "";
  for (let i = 0; i < length; i++) {
    const rnd = Math.floor(Math.random() * characters.length);
    id += characters.charAt(rnd);
  }

  return id;
}
