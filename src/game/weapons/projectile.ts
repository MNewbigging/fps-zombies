import * as YUKA from "yuka";
import { Player } from "../entities/player";
import { eventListener } from "../listeners/event-listener";

export class Projectile extends YUKA.MovingEntity {
  private lifetime = 1;
  private currentLifetime = 0;

  constructor(
    public player: Player,
    public ray: YUKA.Ray,
    public targetPosition: YUKA.Vector3
  ) {
    super();

    this.canActivateTrigger = false;
    this.updateOrientation = false;

    // Velocity never changes - work it out once
    this.maxSpeed = 100;

    this.position.copy(ray.origin);
    this.velocity.copy(ray.direction).multiplyScalar(this.maxSpeed);

    // Lifetime
    const relativeLifetime =
      new YUKA.Vector3().copy(ray.origin).distanceTo(targetPosition) /
      this.maxSpeed;

    this.lifetime = Math.min(relativeLifetime, 2);
  }

  override update(delta: number): this {
    // Remove if lifetime is up
    this.currentLifetime += delta;
    if (this.currentLifetime > this.lifetime) {
      this.player.gameState.removeEntity(this);

      return this;
    }

    super.update(delta);

    // Check if near enough the target
    const distanceToTarget = this.targetPosition.squaredDistanceTo(
      this.position
    );
    if (distanceToTarget < 0.1) {
      // Fire an event to say we hit this location
      //eventListener.fire("projectile-hit", this);
    }

    return this;
  }
}
