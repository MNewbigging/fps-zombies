import * as YUKA from "yuka";
import * as THREE from "three";

export class AmmoPickup extends YUKA.GameEntity {
  constructor(public renderComponent: THREE.Object3D) {
    super();

    this.canActivateTrigger = false;
  }

  override update(delta: number): this {
    // Rotate constantly
    const euler = { x: 0, y: 0, z: 0 };
    this.rotation.toEuler(euler);

    euler.y += delta;

    this.rotation.fromEuler(euler.x, euler.y, euler.z);

    return this;
  }
}
