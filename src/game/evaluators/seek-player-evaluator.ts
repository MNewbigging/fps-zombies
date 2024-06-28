import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";
import { SeekPlayerGoal } from "../goals/seek-player-goal";

export class SeekPlayerEvaluator extends YUKA.GoalEvaluator<Zombie> {
  override calculateDesirability(owner: Zombie): number {
    // Attack evaluator checks for distance and returns 1 or 0
    // So this can return anything between 0 and 1
    return 0.5;
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
