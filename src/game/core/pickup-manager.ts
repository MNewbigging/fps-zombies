import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";
import { eventListener } from "../listeners/event-listener";
import { AmmoPickup } from "../entities/ammo-pickup";
import { GameState } from "./game-state";
import { HealthPickup } from "../entities/health-pickup";

export enum PickupType {
  AMMO,
  HEALTH,
}

export class PickupManager {
  spawnedAmmoPickup = false;
  spawnedHealthPickup = false;

  constructor(private gameState: GameState) {
    eventListener.on("zombie-died", this.onZombieDied);
    eventListener.on("got-pickup", this.onGotPickup);
  }

  private hasLowAmmo() {
    if (!this.gameState.player.weaponSystem.currentWeapon) {
      return;
    }

    const reserveAmmo =
      this.gameState.player.weaponSystem.currentWeapon.reserveAmmo;
    const magLimit = this.gameState.player.weaponSystem.currentWeapon.magLimit;

    return reserveAmmo < magLimit;
  }

  private hasLowHealth() {
    const currentHealth = this.gameState.player.health;
    const maxHealth = this.gameState.player.maxHealth;

    const remainingPercent = (currentHealth / maxHealth) * 100;

    return remainingPercent < 25;
  }

  private spawnAmmoPickup(position: YUKA.Vector3) {
    const ammoIcon = this.gameState.assetManager.cloneModel("ammo-icon");
    this.gameState.assetManager.applyModelTexture(ammoIcon, "zombie-atlas");

    const ammoPickup = new AmmoPickup(PickupType.AMMO, this.gameState.player);
    ammoPickup.position.copy(position);
    ammoPickup.position.y += 1;
    ammoPickup.scale.multiplyScalar(0.01);

    this.gameState.addEntity(ammoPickup, ammoIcon);

    this.spawnedAmmoPickup = true;
  }

  private spawnHealthPickup(position: YUKA.Vector3) {
    const healthIcon = this.gameState.assetManager.cloneModel("health-icon");
    this.gameState.assetManager.applyModelTexture(healthIcon, "zombie-atlas");

    const healthPickup = new HealthPickup(
      PickupType.HEALTH,
      this.gameState.player
    );
    healthPickup.position.copy(position);
    healthPickup.position.y += 1;
    healthPickup.scale.multiplyScalar(0.01);

    this.gameState.addEntity(healthPickup, healthIcon);

    this.spawnedHealthPickup = true;
  }

  private onZombieDied = (zombie: Zombie) => {
    // Get valid potential pickups
    const validPickups: PickupType[] = [];

    if (!this.spawnedAmmoPickup && this.hasLowAmmo()) {
      validPickups.push(PickupType.AMMO);
    }
    if (!this.spawnedHealthPickup && this.hasLowHealth()) {
      validPickups.push(PickupType.HEALTH);
    }

    // Pick a random one
    if (validPickups.length) {
      const rnd = Math.floor(Math.random() * validPickups.length);
      const pickup = validPickups[rnd];

      switch (pickup) {
        case PickupType.AMMO:
          this.spawnAmmoPickup(zombie.position);
          break;
        case PickupType.HEALTH:
          this.spawnHealthPickup(zombie.position);
          break;
      }
    }
  };

  private onGotPickup = (type: PickupType) => {
    switch (type) {
      case PickupType.AMMO:
        this.spawnedAmmoPickup = false;
        break;
      case PickupType.HEALTH:
        this.spawnedHealthPickup = false;
        break;
    }
  };
}
