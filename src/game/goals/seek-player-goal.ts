import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";

export class SeekPlayerGoal extends YUKA.Goal<Zombie> {
  constructor(public owner: Zombie) {
    super(owner);
  }

  override activate(): void {
    const owner = this.owner;
    const path = owner.path;

    console.log("activate");

    if (!path) {
      // Find a new path
      owner.pathPlanner.findPath(
        owner,
        this.owner.position,
        this.owner.player.position,
        this.onPathFound
      );

      // Idle while finding
      owner.playAnimation("zombie-idle");

      return;
    }

    // If starting with a path, ensure zombie is walking
    owner.playAnimation("zombie-walk");
  }

  override execute(): void {
    if (this.active()) {
      if (this.owner.atPosition(this.owner.player.position)) {
        this.status = YUKA.Goal.STATUS.COMPLETED;
      }
    }
  }

  override terminate(): void {
    // Remove the old path
    this.owner.followPathBehaviour.active = false;
    this.owner.followPathBehaviour.path.clear();
    this.owner.path = undefined;

    // Default to idle animation
    this.owner.playAnimation("zombie-idle");

    console.log("terminate");
  }

  private onPathFound = (owner: Zombie, path: YUKA.Vector3[]) => {
    console.log("on path found");
    // Set the new path and start walking
    owner.path = path;

    const followPathBehaviour = owner.followPathBehaviour;
    followPathBehaviour.path.clear();

    path.forEach((waypoint) => {
      followPathBehaviour.path.add(waypoint);
    });

    followPathBehaviour.active = true;

    owner.playAnimation("zombie-walk");
  };
}
