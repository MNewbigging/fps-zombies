import * as THREE from "three";
import * as YUKA from "yuka";
import { Player } from "../entities/player";
import { sync } from "./game-state";

export class WeaponSystem {
  private pistolRenderComponent: THREE.Object3D;

  constructor(private player: Player) {
    const assetManager = player.gameState.assetManager;
    const scene = player.gameState.scene;

    // pistol

    this.pistolRenderComponent =
      player.gameState.assetManager.models.get("pistol");
    assetManager.applyModelTexture(this.pistolRenderComponent, "weapon-atlas");
    this.pistolRenderComponent.matrixAutoUpdate = false;
    // scene.add(this.pistolRenderComponent);
    // player.weaponContainer.setRenderComponent(this.pistolRenderComponent, sync);

    //this.pistolRenderComponent.visible = false;
  }
}
