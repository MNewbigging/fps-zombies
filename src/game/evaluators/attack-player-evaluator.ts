import * as YUKA from "yuka";
import { POSITION_EQUALITY_TOLERANCE, Zombie } from "../entities/zombie";
import { AttackPlayerGoal } from "../goals/attack-player-goal";

export class AttackPlayerEvaluator extends YUKA.GoalEvaluator<Zombie> {
  override calculateDesirability(owner: Zombie): number {
    // If the zombie is close enough to player, it wants to attack
    const distanceSq = owner.position.squaredDistanceTo(
      owner.gameState.player.position
    );
    const closeEnough =
      POSITION_EQUALITY_TOLERANCE * POSITION_EQUALITY_TOLERANCE;

    // Death evaluator returns 1, so this should be slighlty lower since dying is more important!
    return distanceSq <= closeEnough ? 0.8 : 0;
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
