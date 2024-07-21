import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";
import { eventListener } from "../listeners/event-listener";
import { AmmoPickup } from "../entities/ammo-pickup";
import { GameState } from "./game-state";
import { HealthPickup } from "../entities/health-pickup";

enum Pickups {
  AMMO,
  HEALTH,
}

export class PickupManager {
  constructor(private gameState: GameState) {
    eventListener.on("zombie-died", this.onZombieDied);
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

    const ammoPickup = new AmmoPickup(this.gameState.player);
    ammoPickup.position.copy(position);
    ammoPickup.position.y += 1;
    ammoPickup.scale.multiplyScalar(0.01);

    this.gameState.addEntity(ammoPickup, ammoIcon);
  }

  private spawnHealthPickup(position: YUKA.Vector3) {
    const healthIcon = this.gameState.assetManager.cloneModel("health-icon");
    this.gameState.assetManager.applyModelTexture(healthIcon, "zombie-atlas");

    const healthPickup = new HealthPickup(this.gameState.player);
    healthPickup.position.copy(position);
    healthPickup.position.y += 1;
    healthPickup.scale.multiplyScalar(0.01);

    this.gameState.addEntity(healthPickup, healthIcon);
  }

  private onZombieDied = (zombie: Zombie) => {
    // Get valid potential pickups
    const validPickups: Pickups[] = [];

    if (this.hasLowAmmo()) {
      validPickups.push(Pickups.AMMO);
    }
    if (this.hasLowHealth()) {
      validPickups.push(Pickups.HEALTH);
    }

    // Pick a random one
    if (validPickups.length) {
      const rnd = Math.floor(Math.random() * validPickups.length);
      const pickup = validPickups[rnd];

      switch (pickup) {
        case Pickups.AMMO:
          this.spawnAmmoPickup(zombie.position);
          break;
        case Pickups.HEALTH:
          this.spawnHealthPickup(zombie.position);
          break;
      }
    }
  };
}
