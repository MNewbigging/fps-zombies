import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";
import { Player } from "../entities/player";
import { FindPathGoal } from "./find-path-goal";
import { FollowPathGoal } from "./follow-path-goal";

export class TrackPlayerGoal extends YUKA.CompositeGoal<Zombie> {
  constructor(public owner: Zombie, public player: Player) {
    super(owner);
  }

  override activate(): void {
    this.clearSubgoals();

    const from = new YUKA.Vector3().copy(this.owner.position);
    const to = new YUKA.Vector3().copy(this.player.position);

    this.addSubgoal(new FindPathGoal(this.owner, from, to));
    this.addSubgoal(new FollowPathGoal(this.owner));
  }

  override execute(): void {
    this.status = this.executeSubgoals();

    this.replanIfFailed();
  }

  override terminate(): void {
    this.clearSubgoals();
  }
}
