import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";
import {
  EntityAnimationEvent,
  eventListener,
} from "../listeners/event-listener";
import { randomId } from "../utils/utils";

export interface ZombieAttackData {
  zombie: Zombie;
  attackId: string;
}

export class AttackPlayerGoal extends YUKA.Goal<Zombie> {
  private lookDirection = new YUKA.Vector3();

  constructor(public owner: Zombie) {
    super(owner);
  }

  override activate(): void {
    // listen for when attack animation loops
    eventListener.on("entity-anim-loop", this.onAnimationLoop);

    // create a new attack id, send delayed hit message to player
    this.createPendingAttack();

    // play attack anim
    this.owner.playAnimation("zombie-attack");
  }

  override execute(): void {
    const owner = this.owner;

    // Face the player
    this.lookDirection = owner.gameState.player.position
      .clone()
      .sub(owner.position)
      .normalize();
    this.owner.rotation.lookAt(owner.forward, this.lookDirection, owner.up);
  }

  override terminate(): void {
    // clear and pending attacks
    this.owner.pendingAttackId = "";

    // remove listeners
    eventListener.off("entity-anim-loop", this.onAnimationLoop);
  }

  private onAnimationLoop = (event: EntityAnimationEvent) => {
    this.createPendingAttack();
  };

  private createPendingAttack() {
    // Each attack has a unique id so player can check the hit request against current pending attack
    // on the zombie - for cases where attack request is sent and then this goal is terminated before
    // the message arrives
    this.owner.pendingAttackId = randomId();
    this.owner.sendMessage(this.owner.gameState.player, "hit", 1, {
      zombie: this.owner,
      attackId: this.owner.pendingAttackId,
    });
  }
}
