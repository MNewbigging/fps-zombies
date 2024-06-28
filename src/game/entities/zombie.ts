import * as YUKA from "yuka";
import * as THREE from "three";
import { PathPlanner } from "../core/path-planner";
import { Player } from "./player";
import { SeekPlayerEvaluator } from "../evaluators/seek-player-evaluator";

const POSITION_EQUALITY_TOLERANCE = 1;

export class Zombie extends YUKA.Vehicle {
  path?: Array<YUKA.Vector3>;
  followPathBehaviour: YUKA.FollowPathBehavior;
  onPathBehaviour: YUKA.OnPathBehavior;
  brain: YUKA.Think<Zombie>;

  private mixer?: THREE.AnimationMixer;
  private animations = new Map<string, THREE.AnimationAction>();
  private currentAction?: THREE.AnimationAction;

  constructor(public pathPlanner: PathPlanner, public player: Player) {
    super();

    // goals

    this.brain = new YUKA.Think(this);
    this.brain.addEvaluator(new SeekPlayerEvaluator());

    // steering

    this.maxSpeed = 5;

    this.followPathBehaviour = new YUKA.FollowPathBehavior();
    this.followPathBehaviour.active = false;
    this.steering.add(this.followPathBehaviour);

    this.onPathBehaviour = new YUKA.OnPathBehavior();
    this.onPathBehaviour.active = false;
    this.onPathBehaviour.path = this.followPathBehaviour.path;
    this.steering.add(this.onPathBehaviour);
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

    this.updateAnimations(delta);

    return this;
  }

  atPosition(position: YUKA.Vector3) {
    const tolerance = POSITION_EQUALITY_TOLERANCE * POSITION_EQUALITY_TOLERANCE;

    const distance = this.position.squaredDistanceTo(position);

    return distance <= tolerance;
  }

  playAnimation(name: string) {
    // if (this.currentAnimation) {
    //   this.currentAnimation.enabled = false;
    // }

    // const action = this.animations.get(name);
    // if (action) {
    //   action.enabled = true;
    //   this.currentAnimation = action;
    // }

    const nextAction = this.animations.get(name);
    if (!nextAction) {
      throw Error(`Could not find animation with name ${name}`);
    }

    nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);

    this.currentAction
      ? nextAction.crossFadeFrom(this.currentAction, 0.25, false).play()
      : nextAction.play();
  }

  private updateAnimations(dt: number) {
    this.mixer?.update(dt);
  }
}
