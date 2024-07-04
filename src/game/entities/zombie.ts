import * as YUKA from "yuka";
import * as THREE from "three";
import { SeekPlayerEvaluator } from "../evaluators/seek-player-evaluator";
import { AttackPlayerEvaluator } from "../evaluators/attack-player-evaluator";
import { TweenFactory } from "../core/tween-factory";
import { DeathEvaluator } from "../evaluators/death-evaluator";
import { AssetManager } from "../core/asset-manager";
import { GameState } from "../core/game-state";
import { eventListener } from "../listeners/event-listener";

export const POSITION_EQUALITY_TOLERANCE = 1.4;

export class Zombie extends YUKA.Vehicle {
  brain: YUKA.Think<Zombie>;

  private navmesh: YUKA.NavMesh;
  private currentRegion: YUKA.Polygon;
  private currentPosition: YUKA.Vector3;
  private previousPosition: YUKA.Vector3;

  private followPathBehaviour: YUKA.FollowPathBehavior;
  private onPathBehaviour: YUKA.OnPathBehavior;

  private mixer: THREE.AnimationMixer;
  private animations = new Map<string, THREE.AnimationAction>();
  private currentAction?: THREE.AnimationAction;

  private lookPosition = new YUKA.Vector3();
  private moveDirection = new YUKA.Vector3();

  private health = 100;

  constructor(
    public renderComponent: THREE.Object3D,
    public gameState: GameState
  ) {
    super();

    // goals

    this.brain = new YUKA.Think(this);
    this.brain.addEvaluator(new SeekPlayerEvaluator());
    this.brain.addEvaluator(new AttackPlayerEvaluator());
    this.brain.addEvaluator(new DeathEvaluator());

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

    this.navmesh = this.gameState.assetManager.navmesh;
    this.currentPosition = this.position.clone();
    this.previousPosition = this.position.clone();
    this.currentRegion = this.navmesh.getClosestRegion(this.position);

    // animations

    this.mixer = new THREE.AnimationMixer(this.renderComponent);
    this.mixer.addEventListener("finished", this.onAnimationEnd);
    this.setupAnimations(this.gameState.assetManager);
  }

  override start(): this {
    // default animation

    this.playAnimation("zombie-idle");

    return this;
  }

  override update(delta: number): this {
    super.update(delta);

    this.brain.execute();

    this.brain.arbitrate();

    this.stayInLevel();

    this.updateAnimations(delta);

    return this;
  }

  override handleMessage(telegram: YUKA.Telegram): boolean {
    switch (telegram.message) {
      case "hit":
        // Take damage
        if (!this.isDead()) {
          this.takeDamage(100);
        }

        break;
    }
    return true;
  }

  atPosition(position: YUKA.Vector3) {
    const tolerance = POSITION_EQUALITY_TOLERANCE * POSITION_EQUALITY_TOLERANCE;

    const distance = this.position.squaredDistanceTo(position);

    return distance <= tolerance;
  }

  isDead() {
    return this.health <= 0;
  }

  followPath(path: YUKA.Vector3[]) {
    // Remove any previous path
    this.followPathBehaviour.path.clear();

    // Assign the waypoints to a new path
    path.forEach((waypoint) => this.followPathBehaviour.path.add(waypoint));

    this.followPathBehaviour.active = true;
    this.onPathBehaviour.active = true;
  }

  stopFollowingPath() {
    this.followPathBehaviour.active = false;
    this.onPathBehaviour.active = false;
  }

  playAnimation(name: string) {
    const nextAction = this.animations.get(name);
    if (!nextAction) {
      throw Error(`Could not find animation with name ${name}`);
    }

    if (nextAction.getClip().name === this.currentAction?.getClip().name) {
      return;
    }

    nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);

    this.currentAction
      ? nextAction.crossFadeFrom(this.currentAction, 0.5, false).play()
      : nextAction.play();

    this.currentAction = nextAction;
  }

  private setupAnimations(assetManager: AssetManager) {
    const idleClip = assetManager.animations.get("zombie-idle");
    const idleAction = this.mixer.clipAction(idleClip);
    this.animations.set(idleClip.name, idleAction);

    const walkClip = assetManager.animations.get("zombie-walk");
    const walkAction = this.mixer.clipAction(walkClip);
    this.animations.set(walkClip.name, walkAction);

    const attackClip = assetManager.animations.get("zombie-attack");
    const attackAction = this.mixer.clipAction(attackClip);
    this.animations.set(attackClip.name, attackAction);

    const deathClip = assetManager.animations.get("zombie-death");
    const deathAction = this.mixer.clipAction(deathClip);
    deathAction.setLoop(THREE.LoopOnce, 1);
    deathAction.clampWhenFinished = true;
    this.animations.set(deathClip.name, deathAction);
  }

  private updateAnimations(dt: number) {
    this.mixer?.update(dt);

    if (!this.isDead()) {
      // Direction owner is moving in
      this.moveDirection.copy(this.velocity).normalize();
      this.lookPosition.copy(this.position).add(this.moveDirection);

      // Look towards it over time, in case direction does a sudden u-turn
      this.rotateTo(this.lookPosition, dt, 0.05);
    }
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

  private takeDamage(damage: number) {
    // Reduce health
    this.health -= damage;

    // Flash red
    const flashAnim = TweenFactory.zombieEmissiveFlash(
      this.renderComponent as THREE.Mesh,
      new THREE.Color("white")
    );
    flashAnim.start();
  }

  private onAnimationEnd = (e: any) => {
    const action = e.action as THREE.AnimationAction;
    eventListener.fire("entity-anim-end", {
      entity: this,
      animName: action.getClip().name,
    });
  };
}
