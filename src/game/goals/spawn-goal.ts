import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";
import {
  EntityAnimationEvent,
  eventListener,
} from "../listeners/event-listener";

export class SpawnGoal extends YUKA.Goal<Zombie> {
  constructor(public owner: Zombie) {
    super(owner);
  }

  override activate(): void {
    console.log("spawn activated");

    eventListener.on("entity-anim-end", this.onAnimationEnd);

    this.owner.playAnimation("zombie-climb");
  }

  override execute(): void {
    //
  }

  override terminate(): void {
    console.log("spawn terminated");
  }

  private onAnimationEnd = (event: EntityAnimationEvent) => {
    if (event.entity === this.owner && event.animName === "zombie-climb") {
      // This zombie has now spawned
      console.log("spawned");
    }
  };
}

/**
 * Flow:
 *
 * Zombie only has a single subgoal when it's constructed - the spawn goal
 * At the end of the goal, it adds all normal goals and terminates, then removes self from brain
 * Must be immune to damage during animation
 */
