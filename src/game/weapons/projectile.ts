import * as YUKA from "yuka";
import { Player } from "../entities/player";

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
  private lifetime = 1;
  private currentLifetime = 0;

  constructor(
    public player: Player,
    public startPoint: YUKA.Vector3,
    public endPoint: YUKA.Vector3
  ) {
    super();

    this.canActivateTrigger = false;
    this.updateOrientation = false;

    // Velocity never changes - work it out once
    this.maxSpeed = 400;

    const direction = endPoint.clone().sub(startPoint).normalize();
    this.velocity.copy(direction).multiplyScalar(this.maxSpeed);
  }

  override update(delta: number): this {
    // Remove if lifetime is up
    this.currentLifetime += delta;
    if (this.currentLifetime > this.lifetime) {
      // Remove self
      this.player.gameState.removeEntity(this);
      return this;
    }

    super.update(delta);

    // Check if near enough the target

    return this;
  }
}
