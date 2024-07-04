import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";

export class SeekPlayerGoal extends YUKA.Goal<Zombie> {
  private lastWaypoint?: YUKA.Vector3;
  private newPathFrequency = 1 / 4;
  private newPathRegulator = new YUKA.Regulator(this.newPathFrequency);

  constructor(public owner: Zombie) {
    super(owner);
  }

  override activate(): void {
    const owner = this.owner;

    // start walking
    owner.playAnimation("zombie-walk");

    // Create a new regular and call ready to ensure timers and frequency are set properly
    this.newPathRegulator = new YUKA.Regulator(this.newPathFrequency);
    this.newPathRegulator.ready();

    // Find a new path
    owner.gameState.pathPlanner.findPath(
      owner,
      owner.position.clone(),
      owner.gameState.player.position.clone(),
      this.onPathFound
    );
  }

  override execute(): void {
    if (!this.active()) {
      return;
    }

    // Check if we've reached the last waypoint
    if (this.lastWaypoint && this.owner.atPosition(this.lastWaypoint)) {
      this.status = YUKA.Goal.STATUS.COMPLETED;
    }

    // Get an updated path
    if (this.newPathRegulator.ready()) {
      const owner = this.owner;

      owner.gameState.pathPlanner.findPath(
        owner,
        owner.position.clone(),
        owner.gameState.player.position.clone(),
        this.onPathFound
      );
    }
  }

  override terminate(): void {
    // Remove the old path
    this.owner.followPathBehaviour.active = false;
    this.owner.followPathBehaviour.path.clear();
    this.owner.path = undefined;

    this.owner.onPathBehaviour.active = false;

    // Clear velocity
    this.owner.velocity.set(0, 0, 0);
  }

  private onPathFound = (owner: Zombie, path: YUKA.Vector3[]) => {
    // Ensure we haven't stopped in the meantime
    if (this.status !== YUKA.Goal.STATUS.ACTIVE) {
      return;
    }

    // Set the new path and start walking
    owner.path = path;

    const followPathBehaviour = owner.followPathBehaviour;
    followPathBehaviour.path.clear();

    path.forEach((waypoint) => {
      followPathBehaviour.path.add(waypoint);
    });

    followPathBehaviour.active = true;
    owner.onPathBehaviour.active = true;

    this.lastWaypoint = path[path.length - 1];
  };
}
