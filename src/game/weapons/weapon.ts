import * as YUKA from "yuka";
import { Player } from "../entities/player";

export class Weapon extends YUKA.GameEntity {
  magAmmo = 0;
  magLimit = 0;
  reserveAmmo = 0;
  reserveLimit = 0;

  constructor(public owner: Player) {
    super();

    this.canActivateTrigger = false;
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

  shoot() {}

  lower() {}

  override update(delta: number): this {
    super.update(delta);

    // update animation mixer

    return this;
  }
}
