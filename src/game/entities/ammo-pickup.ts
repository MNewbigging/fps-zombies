import * as YUKA from "yuka";
import * as THREE from "three";
import { Player } from "./player";

export class AmmoPickup extends YUKA.GameEntity {
  private pickupRange = 0.5;

  constructor(private player: Player) {
    super();

    this.canActivateTrigger = false;
  }

  override update(delta: number): this {
    if (this.shouldPickup()) {
      this.player.weaponSystem.pickupAmmo();
      this.player.gameState.removeEntity(this);
    }

    this.spin(delta);

    return this;
  }

  private spin(delta: number) {
    const euler = { x: 0, y: 0, z: 0 };
    this.rotation.toEuler(euler);

    euler.y += delta;

    this.rotation.fromEuler(euler.x, euler.y, euler.z);
  }

  private shouldPickup() {
    // Don't care about height
    const a = this.player.position;
    const b = this.position;

    const distSq = (a.x - b.x) * (a.x - b.x) + (a.z - b.z) * (a.z - b.z);
    const rSq = this.pickupRange * this.pickupRange;

    const withinRange = distSq < rSq;

    return withinRange;
  }
}
