import * as YUKA from "yuka";
import * as THREE from "three";
import { FpsControls } from "../controls/fps-controls";
import { GameState } from "../core/game-state";
import { WeaponSystem } from "../core/weapon-system";
import { ZombieAttackData } from "../goals/attack-player-goal";
import { action, makeObservable, observable } from "mobx";

export class Player extends YUKA.MovingEntity {
  head: YUKA.GameEntity;
  fpsControls: FpsControls;
  weaponContainer: YUKA.GameEntity;
  weaponSystem: WeaponSystem;

  health = 100;
  maxHealth = 100;

  private currentRegion: YUKA.Polygon;
  private currentPosition: YUKA.Vector3;
  private previousPosition: YUKA.Vector3;

  private ray = new YUKA.Ray();
  private targetPosition = new YUKA.Vector3();

  constructor(public gameState: GameState) {
    super();

    makeObservable(this, {
      health: observable,
      takeDamage: action,
      addHealth: action,
    });

    // the camera is attached to the player's head

    this.head = new YUKA.GameEntity();
    this.head.forward.set(0, 0, -1);
    this.head.position.y = 1.7;
    this.add(this.head);

    // player owns the first person controls

    this.updateOrientation = false;
    this.fpsControls = new FpsControls(this);
    this.fpsControls.enable();

    this.maxSpeed = 6;

    // get closest navmesh region to player

    this.currentPosition = this.position.clone();
    this.previousPosition = this.position.clone();
    this.currentRegion = this.gameState.assetManager.navmesh.getClosestRegion(
      this.position
    );

    // weapon setup

    this.weaponContainer = new YUKA.GameEntity();
    this.head.add(this.weaponContainer);
    this.weaponSystem = new WeaponSystem(this);
  }

  override update(delta: number): this {
    super.update(delta);

    this.fpsControls.update(delta);

    this.stayInLevel();

    return this;
  }

  override handleMessage(telegram: YUKA.Telegram): boolean {
    switch (telegram.message) {
      case "hit":
        const zombieAttackData = telegram.data as ZombieAttackData;

        // Ensure the incoming attack id matches the pending attack id of the zombie
        if (
          zombieAttackData.zombie.pendingAttackId === zombieAttackData.attackId
        ) {
          this.takeDamage();
        }
        break;
    }

    return true;
  }

  shoot() {
    const head = this.head;
    const ray = this.ray;
    const targetPosition = this.targetPosition;

    // First, check if player is able to shoot before doing more work
    const equippedWeapon = this.weaponSystem.currentWeapon;
    if (!equippedWeapon || !equippedWeapon.canShoot()) {
      return;
    }

    // The ray starts at the muzzle
    equippedWeapon.muzzle.getWorldPosition(ray.origin);
    head.getWorldDirection(ray.direction);

    // Guns are completely accurate for now, do bullet spread here later

    // Get any scene & entity intersection
    const intersection = this.gameState.getShotIntersection();

    if (intersection.sceneIntersection) {
      targetPosition.set(
        intersection.sceneIntersection.point.x,
        intersection.sceneIntersection.point.y,
        intersection.sceneIntersection.point.z
      );

      ray.direction = targetPosition.clone().sub(ray.origin).normalize();
    } else {
      // Get direction from where we're looking
      head.getWorldDirection(ray.direction);

      // Scale it by a flat amount
      targetPosition.copy(ray.origin).add(ray.direction.multiplyScalar(1000));
    }

    // Debug the shot
    //this.gameState.debugShot(this.ray, targetPosition);

    // Shoot the equipped gun
    this.weaponSystem.currentWeapon?.shoot(this.ray, targetPosition);

    // Inform entity that it was hit
    if (intersection.entity) {
      this.sendMessage(intersection.entity, "hit", 0, intersection);
    }
  }

  takeDamage() {
    this.health = Math.max(0, this.health - 10);
  }

  addHealth(health: number) {
    this.health = Math.min(this.health + health, this.maxHealth);
  }

  private stayInLevel() {
    this.currentPosition.copy(this.position);

    this.currentRegion = this.gameState.assetManager.navmesh.clampMovement(
      this.currentRegion,
      this.previousPosition,
      this.currentPosition,
      this.position
    );

    this.previousPosition.copy(this.position);

    // adjust height according to the ground

    const distance = this.currentRegion.plane.distanceToPoint(this.position);

    this.position.y -= distance * 0.2;
  }
}
