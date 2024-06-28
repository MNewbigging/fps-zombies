import * as YUKA from "yuka";
import { POSITION_EQUALITY_TOLERANCE, Zombie } from "../entities/zombie";
import { AttackPlayerGoal } from "../goals/attack-player-goal";

export class AttackPlayerEvaluator extends YUKA.GoalEvaluator<Zombie> {
  override calculateDesirability(owner: Zombie): number {
    // If the zombie is close enough to player, it wants to attack
    const distanceSq = owner.position.squaredDistanceTo(owner.player.position);
    const closeEnough =
      POSITION_EQUALITY_TOLERANCE * POSITION_EQUALITY_TOLERANCE;

    return Number(!!(distanceSq <= closeEnough));
  }

  override setGoal(owner: Zombie): void {
    const currentGoal = owner.brain.currentSubgoal();

    if (currentGoal instanceof AttackPlayerGoal) {
      return;
    }

    owner.brain.clearSubgoals();

    owner.brain.addSubgoal(new AttackPlayerGoal(owner));
  }
}
