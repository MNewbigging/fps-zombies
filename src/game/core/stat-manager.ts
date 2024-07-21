import { action, computed, makeAutoObservable, observable } from "mobx";
import { Player } from "../entities/player";
import { Zombie } from "../entities/zombie";
import { eventListener } from "../listeners/event-listener";

export interface Stats {
  maxHealth: number;
}

export class StatManager {
  @observable upgradePoints = 0;
  @observable upgradedStats: Stats;

  constructor(private player: Player) {
    makeAutoObservable(this);

    // Upgraded stats is a copy
    this.upgradedStats = { ...this.getCurrentStats() };

    eventListener.on("zombie-died", this.onZombieDied);
  }

  @computed getCurrentStats(): Stats {
    return {
      maxHealth: this.player.maxHealth,
    };
  }

  applyUpgrades() {
    // Apply new values from stats copy to real stats
    this.player.maxHealth = this.upgradedStats.maxHealth;

    // Update the stats copy
    this.upgradedStats = { ...this.getCurrentStats() };
  }

  cancelUpgrades() {
    this.upgradedStats = { ...this.getCurrentStats() };
  }

  @action increaseMaxHealth = () => {
    if (this.upgradePoints > 0) {
      this.upgradedStats.maxHealth += 10;
      this.upgradePoints--;
    }
  };

  @action decreaseMaxHealth = () => {
    const currentValue = this.getCurrentStats().maxHealth;

    if (this.upgradedStats.maxHealth === currentValue) {
      return;
    }

    this.upgradedStats.maxHealth = Math.max(
      this.upgradedStats.maxHealth - 10,
      currentValue
    );
    this.upgradePoints++;
  };

  private onZombieDied = (zombie: Zombie) => {
    this.upgradePoints++;
  };
}
