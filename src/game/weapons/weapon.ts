import * as YUKA from "yuka";
import { Player } from "../entities/player";

export class Weapon extends YUKA.GameEntity {
  magAmmo = 0;
  magLimit = 0;
  reserveAmmo = 0;
  reserveLimit = 0;

  private timeBetweenShots = 1; // 1 rpm default
  private time = new YUKA.Time();

  constructor(public owner: Player) {
    super();

    this.canActivateTrigger = false;
  }

  setRpm(rpm: number) {
    this.timeBetweenShots = 1 / (rpm / 60);
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
    this.time.update();
    return this.time.getElapsed() >= this.timeBetweenShots;
  }

  shoot() {}

  lower() {}

  override update(delta: number): this {
    super.update(delta);

    // update animation mixer

    return this;
  }
}
