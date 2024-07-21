import * as YUKA from "yuka";
import * as THREE from "three";
import { Player } from "../entities/player";
import { Projectile } from "./projectile";
import { TweenFactory } from "../core/tween-factory";
import { action, makeObservable, observable } from "mobx";

export class Weapon extends YUKA.GameEntity {
  magAmmo = 0;
  magLimit = 0;
  reserveAmmo = 0;
  reserveLimit = 0;

  muzzle: YUKA.GameEntity;

  msBetweenShots = 1000; // 60 rpm default
  private lastShotTime = 0;

  private mixer: THREE.AnimationMixer;
  private reloadAction?: THREE.AnimationAction;

  constructor(public player: Player, public renderComponent: THREE.Object3D) {
    super();

    // observables

    makeObservable(this, {
      magAmmo: observable,
      reserveAmmo: observable,
      shoot: action,
    });

    //

    this.canActivateTrigger = false;

    // muzzle

    this.muzzle = new YUKA.GameEntity();
    this.add(this.muzzle);

    // animations

    this.mixer = new THREE.AnimationMixer(renderComponent);
    this.mixer.addEventListener("finished", this.onAnimationEnd);
    renderComponent.traverse((child) => {
      if (child.animations.length) {
        this.reloadAction = this.mixer.clipAction(child.animations[0]);
        this.reloadAction.setLoop(THREE.LoopOnce, 1);
      }
    });
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

  playReloadAnimation() {
    if (this.reserveAmmo > 0 && this.magAmmo !== this.magLimit) {
      // Play the animation, when it ends it'll call this.onAnimationEnd
      this.reloadAction?.reset().play();
    }
  }

  reload() {
    // Add any bullets left in ejected mag back into reserve
    this.reserveAmmo += this.magAmmo;

    // Fill mag from reserve
    if (this.reserveAmmo >= this.magLimit) {
      this.magAmmo = this.magLimit;
      this.reserveAmmo -= this.magLimit;
    } else {
      this.magAmmo = this.reserveAmmo;
      this.reserveAmmo = 0;
    }
  }

  canShoot() {
    const now = performance.now();
    const sinceLast = now - this.lastShotTime;
    const canFire = sinceLast >= this.msBetweenShots;

    const hasAmmo = this.magAmmo > 0;

    return canFire && hasAmmo;
  }

  shoot(ray: YUKA.Ray, targetPosition: YUKA.Vector3) {
    if (!this.canShoot()) {
      return;
    }

    this.lastShotTime = performance.now();

    // audio

    // animation

    const recoilAnim = TweenFactory.recoilWeapon(this);
    recoilAnim.start();

    // create bullet

    this.addBullet(ray, targetPosition);

    // adjust ammo

    this.magAmmo = Math.max(0, this.magAmmo - 1);
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
    this.mixer.update(delta);

    return this;
  }

  private onAnimationEnd = () => {
    // For now, the only mixer animation on the weapon is reload
    this.reload();
  };
}
