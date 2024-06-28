import * as YUKA from "yuka";
import * as THREE from "three";
import { PathPlanner } from "../core/path-planner";
import { Player } from "./player";
import { SeekPlayerEvaluator } from "../evaluators/seek-player-evaluator";
import { AttackPlayerEvaluator } from "../evaluators/attack-player-evaluator";

export const POSITION_EQUALITY_TOLERANCE = 1;

export class Zombie extends YUKA.Vehicle {
  path?: Array<YUKA.Vector3>;
  followPathBehaviour: YUKA.FollowPathBehavior;
  onPathBehaviour: YUKA.OnPathBehavior;
  brain: YUKA.Think<Zombie>;

  private currentRegion: YUKA.Polygon;
  private currentPosition: YUKA.Vector3;
  private previousPosition: YUKA.Vector3;

  private mixer?: THREE.AnimationMixer;
  private animations = new Map<string, THREE.AnimationAction>();
  private currentAction?: THREE.AnimationAction;

  private lookPosition = new YUKA.Vector3();
  private moveDirection = new YUKA.Vector3();

  constructor(
    public pathPlanner: PathPlanner,
    public player: Player,
    public navmesh: YUKA.NavMesh
  ) {
    super();

    // goals

    this.brain = new YUKA.Think(this);
    this.brain.addEvaluator(new SeekPlayerEvaluator());
    this.brain.addEvaluator(new AttackPlayerEvaluator());

    // steering

    this.maxTurnRate = Math.PI / 4;
    this.updateOrientation = false;
    this.maxSpeed = 0.25;

    this.followPathBehaviour = new YUKA.FollowPathBehavior();
    this.followPathBehaviour.active = false;
    this.steering.add(this.followPathBehaviour);

    this.onPathBehaviour = new YUKA.OnPathBehavior();
    this.onPathBehaviour.active = false;
    this.onPathBehaviour.path = this.followPathBehaviour.path;
    this.onPathBehaviour.predictionFactor = 0;
    this.steering.add(this.onPathBehaviour);

    // navmesh

    this.currentPosition = this.position.clone();
    this.previousPosition = this.position.clone();
    this.currentRegion = navmesh.getClosestRegion(this.position);
  }

  setAnimations(mixer: THREE.AnimationMixer, clips: THREE.AnimationClip[]) {
    this.mixer = mixer;

    clips.forEach((clip) => {
      const action = mixer.clipAction(clip);
      // action.play();
      // action.enabled = false;

      this.animations.set(clip.name, action);
    });
  }

  override start(): this {
    // default animation

    this.playAnimation("zombie-idle");

    return this;
  }

  override update(delta: number): this {
    super.update(delta);

    this.brain.execute();

    // could I use a regulator to limit how often new paths are found?
    this.brain.arbitrate();

    this.stayInLevel();

    this.updateAnimations(delta);

    return this;
  }

  atPosition(position: YUKA.Vector3) {
    const tolerance = POSITION_EQUALITY_TOLERANCE * POSITION_EQUALITY_TOLERANCE;

    const distance = this.position.squaredDistanceTo(position);

    return distance <= tolerance;
  }

  playAnimation(name: string) {
    const nextAction = this.animations.get(name);
    if (!nextAction) {
      throw Error(`Could not find animation with name ${name}`);
    }

    nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);

    this.currentAction
      ? nextAction.crossFadeFrom(this.currentAction, 0.5, false).play()
      : nextAction.play();

    this.currentAction = nextAction;
  }

  private updateAnimations(dt: number) {
    this.mixer?.update(dt);

    // Direction owner is moving in
    this.moveDirection.copy(this.velocity).normalize();
    this.lookPosition.copy(this.position).add(this.moveDirection);

    // Look towards it over time, in case direction does a sudden u-turn
    this.rotateTo(this.lookPosition, dt, 0.05);
  }

  private stayInLevel() {
    // "currentPosition" represents the final position after the movement for a single
    // simualation step. it's now necessary to check if this point is still on
    // the navMesh

    this.currentPosition.copy(this.position);

    this.currentRegion = this.navmesh.clampMovement(
      this.currentRegion,
      this.previousPosition,
      this.currentPosition,
      this.position // this is the result vector that gets clamped
    );

    // save this position for the next method invocation

    this.previousPosition.copy(this.position);

    // adjust height of the entity according to the ground

    const distance = this.currentRegion.plane.distanceToPoint(this.position);

    this.position.y -= distance * 0.2; // smooth transition

    return this;
  }
}
