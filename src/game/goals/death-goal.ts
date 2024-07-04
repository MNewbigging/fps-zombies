import * as YUKA from "yuka";
import * as THREE from "three";
import { Zombie } from "../entities/zombie";
import { TweenFactory } from "../core/tween-factory";

export class DeathGoal extends YUKA.Goal<Zombie> {
  constructor(public owner: Zombie) {
    super(owner);
  }

  override activate(): void {
    this.owner.playAnimation("zombie-death", this.onDeathAnimComplete);
  }

  private onDeathAnimComplete = () => {
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
