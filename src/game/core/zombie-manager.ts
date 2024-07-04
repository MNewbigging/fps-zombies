import * as THREE from "three";
import { GameState } from "./game-state";
import { Zombie } from "../entities/zombie";
import {
  EntityAnimationEvent,
  eventListener,
} from "../listeners/event-listener";

export class ZombieManager {
  zombies: Zombie[] = [];
  private spawningZombies: Zombie[] = [];

  constructor(private gameState: GameState) {
    eventListener.on("entity-anim-end", this.onAnimationEnd);
  }

  spawnZombie(x: number, y: number, z: number) {
    const assetManager = this.gameState.assetManager;

    // Setup the render component
    const renderComponent = assetManager.cloneModel("zombie");
    const texture = assetManager.textures.get("zombie-atlas");
    renderComponent.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshLambertMaterial({
          map: texture,
          vertexColors: false,
          transparent: true,
          opacity: 1,
        });
      }
    });

    // Create the zombie
    const zombie = new Zombie(renderComponent, this.gameState);
    zombie.scale.multiplyScalar(0.01); // massive synty models

    // Position according to spawn point
    zombie.position.set(-6, y, z);

    // Adjust position as required by the spawn animation (e.g 'climb' needs to start lower down)
    zombie.position.y -= 2.3;

    // Add the zombie
    this.gameState.addEntity(zombie, renderComponent);
    this.spawningZombies.push(zombie);

    // Start the spawning animation
    zombie.playAnimation("zombie-climb");
  }

  private onAnimationEnd = (event: EntityAnimationEvent) => {
    // Is this for a spawning zombie?
    const zombieIndex = this.spawningZombies.findIndex(
      (zombie) => zombie === event.entity
    );
    if (zombieIndex === -1) {
      return;
    }

    const zombie = this.spawningZombies[zombieIndex];

    // zombie.playAnimation("zombie-idle");
    // zombie.position.y = 0;

    zombie.completeSpawn();

    this.spawningZombies.splice(zombieIndex, 1);
    this.zombies.push(zombie);
  };
}
