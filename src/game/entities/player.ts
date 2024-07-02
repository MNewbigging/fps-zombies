import * as YUKA from "yuka";
import * as THREE from "three";
import { FpsControls } from "../controls/fps-controls";
import { GameState, sync } from "../core/game-state";
import { WeaponSystem } from "../core/weapon-system";
import { Projectile } from "../weapons/projectile";

export class Player extends YUKA.MovingEntity {
  head: YUKA.GameEntity;
  height = 1.7;
  fpsControls: FpsControls;
  weaponContainer: YUKA.GameEntity;
  weaponSystem: WeaponSystem;

  private currentRegion: YUKA.Polygon;
  private currentPosition: YUKA.Vector3;
  private previousPosition: YUKA.Vector3;

  private ray = new YUKA.Ray();
  private targetPosition = new YUKA.Vector3();

  constructor(public gameState: GameState) {
    super();

    // the camera is attached to the player's head

    this.head = new YUKA.GameEntity();
    this.head.forward.set(0, 0, -1);
    this.head.position.y = this.height;
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

  shoot() {
    const head = this.head;
    const ray = this.ray;
    const targetPosition = this.targetPosition;

    // First, check if player is able to shoot before doing more work
    const equippedWeapon = this.weaponSystem.currentWeapon;
    if (!equippedWeapon || !equippedWeapon.canShoot()) {
      console.log("cant shoot");
      return;
    }

    // The ray starts at the muzzle
    equippedWeapon.muzzle.getWorldPosition(ray.origin);
    head.getWorldDirection(ray.direction);

    // Guns are completely accurate for now, do bullet spread here later

    // I need a target position for the projectile, raycast into scene to find it
    const intersection = this.gameState.getCameraIntersection();

    if (intersection) {
      targetPosition.set(
        intersection.point.x,
        intersection.point.y,
        intersection.point.z
      );

      ray.direction = targetPosition.clone().sub(ray.origin).normalize();
    } else {
      // Get direction from where we're looking
      head.getWorldDirection(ray.direction);

      // Scale it by a flat amount
      targetPosition.copy(ray.origin).add(ray.direction.multiplyScalar(1000));
    }

    // Debug the shot
    this.gameState.debugShot(this.ray, targetPosition);

    // Shoot the equipped gun
    this.weaponSystem.currentWeapon?.shoot(this.ray, targetPosition);
  }

  addBullet(ray: YUKA.Ray, targetPosition: YUKA.Vector3) {
    const assetManager = this.gameState.assetManager;

    // Create bullet trail object
    const bulletTrail = assetManager.models.get("bullet-trail").clone();
    bulletTrail.material.map = assetManager.textures.get("bullet-trail");

    // Flip it flat
    bulletTrail.rotateX(Math.PI / 2);

    // Parent it so it remains flat when facing forward
    const renderComponent = new THREE.Group();
    renderComponent.add(bulletTrail);

    // Create the bullet entity
    const bullet = new Projectile(this, ray, targetPosition);
    const rot = bullet.rotation;

    const helper = renderComponent as THREE.Object3D;

    // Start at the ray's origin
    helper.position.set(
      bullet.position.x,
      bullet.position.y,
      bullet.position.z
    );

    // // Face end
    bullet.lookAt(targetPosition);
    helper.setRotationFromQuaternion(
      new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)
    );

    // // Find right
    // const right = new YUKA.Vector3(1, 0, 0);
    // right.applyRotation(bullet.rotation);

    // // Rotate around that axis
    // helper.rotateOnAxis(
    //   new THREE.Vector3(right.x, right.y, right.z),
    //   Math.PI / 2
    // );

    // Just draw it
    this.gameState.scene.add(renderComponent);
    //this.gameState.addEntity(bullet, renderComponent);
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
