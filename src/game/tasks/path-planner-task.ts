import * as YUKA from "yuka";
import { PathPlanner } from "../core/path-planner";
import { Zombie } from "../entities/zombie";

export type PathFoundCallback = (zombie: Zombie, path: YUKA.Vector3[]) => void;

export class PathPlannerTask extends YUKA.Task {
  constructor(
    private planner: PathPlanner,
    private zombie: Zombie,
    private from: YUKA.Vector3,
    private to: YUKA.Vector3,
    private callback: PathFoundCallback
  ) {
    super();
  }

  override execute(): void {
    const path = this.planner.navMesh.findPath(this.from, this.to);

    this.callback(this.zombie, path);
  }
}
