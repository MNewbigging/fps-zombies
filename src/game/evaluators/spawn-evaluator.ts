import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";
import { SpawnGoal } from "../goals/spawn-goal";

export class SpawnEvaluator extends YUKA.GoalEvaluator<Zombie> {
  override calculateDesirability(owner: Zombie): number {
    // Should only be this goal on a new zombie
    return 1;
  }

  override setGoal(owner: Zombie): void {
    const currentGoal = owner.brain.currentSubgoal();

    if (currentGoal instanceof SpawnGoal) {
      return;
    }

    owner.brain.clearSubgoals();

    owner.brain.addSubgoal(new SpawnGoal(owner));
  }
}
