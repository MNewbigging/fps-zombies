import * as THREE from "three";
import * as YUKA from "yuka";
import { GameState } from "./game-state";
import { Zombie } from "../entities/zombie";

export class ZombieManager {
  zombies: Zombie[] = [];

  constructor(private gameState: GameState) {}

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
    zombie.position.set(x, y, z);

    // Add the zombie
    this.gameState.addEntity(zombie, renderComponent);
    this.zombies.push(zombie);
  }

  removeZombie(zombie: YUKA.GameEntity) {
    this.zombies = this.zombies.filter((z) => z !== zombie);
  }
}
