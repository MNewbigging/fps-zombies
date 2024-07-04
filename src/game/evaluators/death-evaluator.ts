import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";
import { DeathGoal } from "../goals/death-goal";

export class DeathEvaluator extends YUKA.GoalEvaluator<Zombie> {
  override calculateDesirability(owner: Zombie): number {
    // Will return 0 or 1
    return Number(owner.isDead());
  }

  override setGoal(owner: Zombie): void {
    const currentGoal = owner.brain.currentSubgoal();

    if (currentGoal instanceof DeathGoal) {
      return;
    }

    owner.brain.clearSubgoals();

    owner.brain.addSubgoal(new DeathGoal(owner));
  }
}
