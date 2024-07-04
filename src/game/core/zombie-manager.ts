import * as THREE from "three";
import { GameState } from "./game-state";
import { Zombie } from "../entities/zombie";

interface ZombieSpawn {
  mixer: THREE.AnimationMixer;
  renderComponent: THREE.Object3D;
}

export class ZombieManager {
  private mixers: THREE.AnimationMixer[] = [];
  private climbOffsetY = -2.25;

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
    renderComponent.scale.multiplyScalar(0.01);

    // Place it at the spawn point minus y offset for climb anim
    renderComponent.position.set(x, y, z);
    renderComponent.position.y += this.climbOffsetY;

    // Setup animations
    const mixer = new THREE.AnimationMixer(renderComponent);
    const climbClip = assetManager.animations.get("zombie-climb");
    const climbAction = mixer.clipAction(climbClip);
    climbAction.setLoop(THREE.LoopOnce, 1);
    climbAction.clampWhenFinished = true;

    this.mixers.push(mixer);
    mixer.addEventListener("finished", () =>
      this.onAnimationEnd(mixer, renderComponent)
    );

    // Add to scene
    this.gameState.scene.add(renderComponent);

    // Start spawn animation
    climbAction.play();
  }

  update(dt: number) {
    // Update spawning zombie mixers
    this.mixers.forEach((mixer) => mixer.update(dt));
  }

  private onAnimationEnd = (
    mixer: THREE.AnimationMixer,
    renderComponent: THREE.Object3D
  ) => {
    console.log("over", renderComponent.position);

    // Remove this render comp from the scene
    this.gameState.scene.remove(renderComponent);

    // Create a zombie now that it is on the map
    const zombie = new Zombie(renderComponent, this.gameState);
    zombie.scale.multiplyScalar(0.01);
    zombie.position.set(
      renderComponent.position.x,
      renderComponent.position.y,
      renderComponent.position.z
    );
    zombie.position.y += this.climbOffsetY;

    this.gameState.addEntity(zombie, renderComponent);
  };
}
