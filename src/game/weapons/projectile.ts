import * as YUKA from "yuka";
import { Player } from "../entities/player";
import { eventListener } from "../../listeners/event-listener";

/**
 * This has a line render component to represent the bullet trail
 * This entity just moves from a to b in a straight line, where
 * a and b is the start and end of the ray generated from shooting.
 *
 * When it reaches b, it will be destroyed and fire an event.
 *
 *
 * May wish to extend this to separate Bullet / Arcing Projectile types later.
 */

export class Projectile extends YUKA.MovingEntity {
  private lifetime = 2;
  private currentLifetime = 0;

  constructor(
    public player: Player,
    public ray: YUKA.Ray,
    public targetPosition: YUKA.Vector3
  ) {
    super();

    this.canActivateTrigger = false;
    this.updateOrientation = false;

    this.scale.set(2, 2, 2);

    // Velocity never changes - work it out once
    this.maxSpeed = 4;

    this.position.copy(ray.origin);
    this.velocity.copy(ray.direction).multiplyScalar(this.maxSpeed);
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
      eventListener.fire("projectile-hit", this);
    }

    return this;
  }
}
