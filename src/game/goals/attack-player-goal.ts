import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";

export class AttackPlayerGoal extends YUKA.Goal<Zombie> {
  private lookDirection = new YUKA.Vector3();

  constructor(public owner: Zombie) {
    super(owner);
  }

  override activate(): void {
    this.owner.playAnimation("zombie-attack");
  }

  override execute(): void {
    const owner = this.owner;

    // Face the player
    this.lookDirection = owner.player.position
      .clone()
      .sub(owner.position)
      .normalize();
    this.owner.rotation.lookAt(owner.forward, this.lookDirection, owner.up);
  }

  override terminate(): void {}
}
