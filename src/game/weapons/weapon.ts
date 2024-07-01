import * as YUKA from "yuka";
import { Player } from "../entities/player";

export class Weapon extends YUKA.GameEntity {
  magAmmo = 0;
  magLimit = 0;
  reserveAmmo = 0;
  reserveLimit = 0;

  private msBetweenShots = 1; // 1 rpm default
  private lastShotTime = performance.now();

  constructor(public owner: Player) {
    super();

    this.canActivateTrigger = false;
  }

  setRpm(rpm: number) {
    this.msBetweenShots = (rpm / 60) * 1000;
  }

  addAmmo(ammoCount: number) {
    this.reserveAmmo = YUKA.MathUtils.clamp(
      this.reserveAmmo + ammoCount,
      0,
      this.reserveLimit
    );
  }

  equip() {
    // update ammo status on the ui
    // start the equip animation
  }

  reload() {}

  canShoot() {
    const now = performance.now();
    const sinceLast = now - this.lastShotTime;

    return sinceLast >= this.msBetweenShots;
  }

  shoot() {
    if (!this.canShoot()) {
      console.log("wait");
      return;
    }

    this.lastShotTime = performance.now();

    // Determine if anything was hit

    // Create a projectile to move towards hit point
    // If there was nothing hit, the projectile goes so far

    console.log("pew");
  }

  lower() {}

  override update(delta: number): this {
    super.update(delta);

    // update animation mixer

    return this;
  }
}
