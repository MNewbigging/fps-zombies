import * as YUKA from "yuka";
import { Player } from "../entities/player";

export class Weapon extends YUKA.GameEntity {
  magAmmo = 0;
  magLimit = 0;
  reserveAmmo = 0;
  reserveLimit = 0;

  private msBetweenShots = 1000; // 60 rpm default
  private lastShotTime = performance.now();
  private spread = new YUKA.Vector3();

  constructor(public player: Player) {
    super();

    this.canActivateTrigger = false;
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

  shoot(targetPosition: YUKA.Vector3) {
    if (!this.canShoot()) {
      console.log("wait");
      return;
    }

    this.lastShotTime = performance.now();

    // audio

    // animation

    // create bullet

    const ray = new YUKA.Ray();

    this.getWorldPosition(ray.origin);
    ray.direction.subVectors(targetPosition, ray.origin).normalize();

    // bullet spread

    this.spread.x = (1 - Math.random() * 2) * 0.01;
    this.spread.y = (1 - Math.random() * 2) * 0.01;
    this.spread.z = (1 - Math.random() * 2) * 0.01;

    ray.direction.add(this.spread).normalize();

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
