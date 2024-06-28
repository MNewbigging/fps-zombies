import * as YUKA from "yuka";
import { FpsControls } from "../controls/fps-controls";

export class Player extends YUKA.MovingEntity {
  head: YUKA.GameEntity;
  height = 1.7;
  fpsControls: FpsControls;

  private currentRegion: YUKA.Polygon;
  private currentPosition: YUKA.Vector3;
  private previousPosition: YUKA.Vector3;

  constructor(private navmesh: YUKA.NavMesh) {
    super();

    // the camera is attached to the player's head

    this.head = new YUKA.GameEntity();
    this.head.forward.set(0, 0, -1);
    this.head.position.y = this.height;
    this.add(this.head);

    // player owns the first person controls

    this.updateOrientation = false;
    this.fpsControls = new FpsControls(this);
    this.fpsControls.enable();

    this.maxSpeed = 6;

    // get closest navmesh region to player

    this.currentPosition = this.position.clone();
    this.previousPosition = this.position.clone();
    this.currentRegion = navmesh.getClosestRegion(this.position);
  }

  override update(delta: number): this {
    super.update(delta);

    this.fpsControls.update(delta);

    this.stayInLevel();

    return this;
  }

  private stayInLevel() {
    this.currentPosition.copy(this.position);

    this.currentRegion = this.navmesh.clampMovement(
      this.currentRegion,
      this.previousPosition,
      this.currentPosition,
      this.position
    );

    this.previousPosition.copy(this.position);

    // adjust height according to the ground

    const distance = this.currentRegion.plane.distanceToPoint(this.position);

    this.position.y -= distance * 0.2;
  }
}
