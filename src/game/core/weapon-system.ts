import * as THREE from "three";
import * as YUKA from "yuka";
import { Player } from "../entities/player";
import { sync } from "./game-state";
import { Weapon } from "../weapons/weapon";
import { Pistol } from "../weapons/pistol";
import { keyboardListener } from "../listeners/keyboard-listener";
import { AmmoPickup } from "../entities/ammo-pickup";
import { Zombie } from "../entities/zombie";
import { eventListener } from "../listeners/event-listener";

/**
 * Responsible for equipping and swapping weapons, setting up render components.
 */
export class WeaponSystem {
  // can only hold two weapons at once
  currentWeapon?: Weapon;
  private secondWeapon?: Weapon;

  private pistolRenderComponent: THREE.Object3D;

  constructor(private player: Player) {
    // setup render components for all weapons

    this.pistolRenderComponent = this.setupPistolRenderComponent();

    // listeners

    keyboardListener.on("r", this.onPressR);
  }

  equipPistol() {
    const pistol = new Pistol(this.player, this.pistolRenderComponent);
    pistol.setRenderComponent(this.pistolRenderComponent, sync);
    this.pistolRenderComponent.visible = true;
    this.player.weaponContainer.add(pistol);

    // will need to work out equipping into given weapon slots later
    this.currentWeapon = pistol;
  }

  pickupAmmo(mags = 4) {
    if (!this.currentWeapon) {
      return;
    }
    // Always picks up n mags worth
    const magLimit = this.currentWeapon.magLimit;
    this.currentWeapon.addAmmo(magLimit * mags);
  }

  private setupPistolRenderComponent() {
    const assetManager = this.player.gameState.assetManager;
    const scene = this.player.gameState.scene;

    const renderComponent = assetManager.models.get("pistol");
    assetManager.applyModelTexture(renderComponent, "weapon-atlas");

    renderComponent.visible = false; // while not equipped
    renderComponent.matrixAutoUpdate = false;

    scene.add(renderComponent);

    return renderComponent;
  }

  private onPressR = () => {
    // Reload the current weapon
    this.currentWeapon?.playReloadAnimation();
  };
}
