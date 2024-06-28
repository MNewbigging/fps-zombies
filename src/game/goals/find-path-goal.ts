import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";

export class FindPathGoal extends YUKA.Goal<Zombie> {
  private from: YUKA.Vector3;
  private to: YUKA.Vector3;

  constructor(public owner: Zombie, from: YUKA.Vector3, to: YUKA.Vector3) {
    super(owner);

    this.from = from;
    this.to = to;
  }

  override activate(): void {
    const owner = this.owner;

    owner.pathPlanner.findPath(owner, this.from, this.to, this.onPathFound);
  }

  override execute(): void {
    // Continually check if the path was found
    if (this.owner.path) {
      this.status = YUKA.Goal.STATUS.COMPLETED;
    }
  }

  private onPathFound = (owner: Zombie, path: YUKA.Vector3[]) => {
    owner.path = path;
  };
}
