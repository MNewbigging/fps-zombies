import * as THREE from "three";
import * as YUKA from "yuka";
import { GameState } from "./game-state";
import { Zombie } from "../entities/zombie";
import { action, makeAutoObservable, observable } from "mobx";
import { eventListener } from "../listeners/event-listener";

export class ZombieManager {
  zombies: Zombie[] = [];
  @observable wave = 0;
  @observable waveZombies = 10;

  private zombieNames: string[] = [];

  constructor(private gameState: GameState) {
    makeAutoObservable(this);

    // Setup zombie names
    this.gameState.assetManager.models.forEach(
      (model: THREE.Group, name: string) => {
        if (name.includes("zombie")) {
          this.zombieNames.push(name);
        }
      }
    );

    eventListener.on("zombie-died", this.onZombieDied);
  }

  @action startNextWave() {
    this.wave++;

    // Spawn zombies for this wave all at once
    const zombieCount = 10;
    for (let i = 0; i < zombieCount; i++) {
      this.spawnZombie();
    }

    this.waveZombies = zombieCount;
  }

  spawnZombie() {
    const assetManager = this.gameState.assetManager;

    // Setup the render component

    const renderComponent = assetManager.cloneModel(this.getRandomZombieName());
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

    // Position in a random spawn point
    const randomRegion = assetManager.navmesh.getRandomRegion();
    const spawnPoint = randomRegion.computeCentroid().centroid;

    zombie.position.copy(spawnPoint);

    // Add the zombie
    this.gameState.addEntity(zombie, renderComponent);
    this.zombies.push(zombie);
  }

  removeZombie(zombie: YUKA.GameEntity) {
    this.zombies = this.zombies.filter((z) => z !== zombie);
  }

  private onZombieDied = (zombie: Zombie) => {
    this.waveZombies--;

    // Next wave?
    if (this.waveZombies === 0) {
      this.startNextWave();
    }
  };

  private getRandomZombieName(): string {
    const rnd = Math.floor(Math.random() * this.zombieNames.length);

    return this.zombieNames[rnd];
  }
}
