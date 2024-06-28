import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";
import { TrackPlayerGoal } from "../goals/track-player-goal";

export class TrackPlayerEvaluator extends YUKA.GoalEvaluator<Zombie> {
  override calculateDesirability(owner: Zombie): number {
    return 1;
  }

  override setGoal(owner: Zombie): void {
    const currentGoal = owner.brain.currentSubgoal();

    if (currentGoal instanceof TrackPlayerGoal) {
      return;
    }

    owner.brain.clearSubgoals();

    owner.brain.addSubgoal(new TrackPlayerGoal(owner, owner.player));
  }
}
