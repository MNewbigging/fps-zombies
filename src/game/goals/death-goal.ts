import * as YUKA from "yuka";
import * as THREE from "three";
import { Zombie } from "../entities/zombie";
import { TweenFactory } from "../core/tween-factory";
import {
  EntityAnimationEvent,
  eventListener,
} from "../listeners/event-listener";

export class DeathGoal extends YUKA.Goal<Zombie> {
  constructor(public owner: Zombie) {
    super(owner);
  }

  override activate(): void {
    eventListener.on("entity-anim-end", this.onEntityAnimEnd);
    this.owner.playAnimation("zombie-death");
  }

  override terminate(): void {
    eventListener.off("entity-anim-end", this.onEntityAnimEnd);
  }

  private onEntityAnimEnd = (animEndEvent: EntityAnimationEvent) => {
    // Do we care about this entity?
    if (this.owner !== animEndEvent.entity) {
      return;
    }

    // Must have been the death animation
    if (animEndEvent.animName !== "zombie-death") {
      return;
    }

    // Can now start fade out anim
    const fadeOutAnim = TweenFactory.zombieFadeOut(
      this.owner.renderComponent as THREE.Mesh
    );

    fadeOutAnim.onComplete(() => {
      this.owner.gameState.removeEntity(this.owner);
    });

    fadeOutAnim.start();
  };
}
