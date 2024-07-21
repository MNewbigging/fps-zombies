import { GameState } from "../game/core/game-state";
import { action, computed, makeAutoObservable, observable } from "mobx";
import { AssetManager } from "../game/core/asset-manager";

export class AppState {
  // Observables for UI
  @observable loaded = false;
  @observable started = false;

  gameState?: GameState;

  private assetManager = new AssetManager();

  constructor() {
    makeAutoObservable(this);

    // Give loading UI time to mount
    setTimeout(() => this.loadGame(), 10);
  }

  @computed getCurrentMagAmmo() {
    return this.gameState?.player.weaponSystem.currentWeapon?.magAmmo ?? 0;
  }

  @computed getCurrentReserveAmmo() {
    return this.gameState?.player.weaponSystem.currentWeapon?.reserveAmmo ?? 0;
  }

  @computed getPlayerHealth() {
    return this.gameState?.player.health ?? 0;
  }

  @computed getCurrentWave() {
    return this.gameState?.zombieManager.wave;
  }

  @computed getRemainingWaveZombies() {
    return this.gameState?.zombieManager.waveZombies;
  }

  @action startGame = () => {
    // Then setup a new game state
    this.gameState = new GameState(this.assetManager);
    this.gameState.start();
    this.started = true;
  };

  private async loadGame() {
    this.assetManager.load().then(this.onLoad);
  }

  @action private onLoad = () => {
    this.loaded = true;
  };
}
