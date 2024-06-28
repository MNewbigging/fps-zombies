import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";
import { SeekPlayerGoal } from "../goals/seek-player-goal";

export class SeekPlayerEvaluator extends YUKA.GoalEvaluator<Zombie> {
  override calculateDesirability(owner: Zombie): number {
    // Depending on distance to player will either seek or attack...
    return 1;
  }

  override setGoal(owner: Zombie): void {
    const currentGoal = owner.brain.currentSubgoal();

    if (currentGoal instanceof SeekPlayerGoal) {
      return;
    }

    owner.brain.clearSubgoals();

    owner.brain.addSubgoal(new SeekPlayerGoal(owner));
  }
}
