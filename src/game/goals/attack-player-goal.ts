import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";

export class AttackPlayerGoal extends YUKA.Goal<Zombie> {
  constructor(public owner: Zombie) {
    super(owner);
  }

  override activate(): void {
    this.owner.playAnimation("zombie-attack");

    console.log("attack goal activated");
  }

  override execute(): void {
    //
  }

  override terminate(): void {
    console.log("attack goal terminated");
  }
}
