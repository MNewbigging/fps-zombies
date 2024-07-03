import * as YUKA from "yuka";
import * as THREE from "three";
import { Player } from "../entities/player";
import { Projectile } from "./projectile";
import { TweenFactory } from "../core/tween-factory";

export class Weapon extends YUKA.GameEntity {
  magAmmo = 0;
  magLimit = 0;
  reserveAmmo = 0;
  reserveLimit = 0;

  muzzle: YUKA.GameEntity;

  msBetweenShots = 1000; // 60 rpm default
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

    const recoilAnim = TweenFactory.recoilWeapon(this, () => {
      console.log("done");
    });
    recoilAnim.start();

    // create bullet

    // add bullet to world

    this.addBullet(ray, targetPosition);

    // adjust ammo
  }

  addBullet(ray: YUKA.Ray, targetPosition: YUKA.Vector3) {
    const assetManager = this.player.gameState.assetManager;

    // Create bullet trail object
    const bulletTrail = assetManager.models.get("bullet-trail").clone();
    bulletTrail.material.map = assetManager.textures.get("bullet-trail");

    // Flip it flat
    bulletTrail.rotateX(Math.PI / 2);
    (bulletTrail as THREE.Object3D).scale.set(0.2, 5, 0.2);

    // Parent it so it remains flat when facing forward
    const renderComponent = new THREE.Group();
    renderComponent.add(bulletTrail);

    // Create the bullet entity
    const bullet = new Projectile(this.player, ray, targetPosition);

    // Face the target position
    bullet.lookAt(targetPosition);

    // Add it
    this.player.gameState.addEntity(bullet, renderComponent);
  }

  lower() {}

  override update(delta: number): this {
    super.update(delta);

    // update animation mixer

    return this;
  }
}
