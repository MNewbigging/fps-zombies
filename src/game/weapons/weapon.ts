import * as YUKA from "yuka";
import { Player } from "../entities/player";

export class Weapon extends YUKA.GameEntity {
  magAmmo = 0;
  magLimit = 0;
  reserveAmmo = 0;
  reserveLimit = 0;

  muzzle: YUKA.GameEntity;

  private msBetweenShots = 1000; // 60 rpm default
  private lastShotTime = 0;
  private spread = new YUKA.Vector3();

  constructor(public player: Player) {
    super();

    this.canActivateTrigger = false;

    this.muzzle = new YUKA.GameEntity();
    this.add(this.muzzle);
  }

  setRpm(rpm: number) {
    this.msBetweenShots = (1 / (rpm / 60)) * 1000;
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
    const canFire = sinceLast >= this.msBetweenShots;

    const hasAmmo = this.magAmmo > 0;

    return canFire && hasAmmo;
  }

  shoot(ray: YUKA.Ray, targetPosition: YUKA.Vector3) {
    if (!this.canShoot()) {
      console.log("wait");
      return;
    }

    this.lastShotTime = performance.now();

    // audio

    // animation

    // create bullet

    // add bullet to world

    this.player.addBullet(ray, targetPosition);

    // adjust ammo
  }

  lower() {}

  override update(delta: number): this {
    super.update(delta);

    // update animation mixer

    return this;
  }
}
