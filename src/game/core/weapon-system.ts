import * as THREE from "three";
import * as YUKA from "yuka";
import { Player } from "../entities/player";
import { sync } from "./game-state";
import { Weapon } from "../weapons/weapon";
import { Pistol } from "../weapons/pistol";

export class WeaponSystem {
  // can only hold two weapons at once
  firstWeapon?: Weapon;
  secondWeapon?: Weapon;

  private pistolRenderComponent: THREE.Object3D;

  constructor(private player: Player) {
    const assetManager = player.gameState.assetManager;
    const scene = player.gameState.scene;

    // setup render components for all weapons

    this.pistolRenderComponent = assetManager.models.get("pistol");
    assetManager.applyModelTexture(this.pistolRenderComponent, "weapon-atlas");
    this.pistolRenderComponent.rotateY(Math.PI);
    this.pistolRenderComponent.visible = false;
    this.pistolRenderComponent.matrixAutoUpdate = false;
    scene.add(this.pistolRenderComponent);
  }

  equipPistol() {
    //
    const pistol = new Pistol(this.player);
    pistol.setRenderComponent(this.pistolRenderComponent, sync);
    this.pistolRenderComponent.visible = true;
    this.player.weaponContainer.add(pistol);

    console.log("equipped pistol", pistol);
  }
}
