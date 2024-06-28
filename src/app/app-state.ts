import { GameState } from "../game/core/game-state";
import { action, makeAutoObservable, observable } from "mobx";
import { EventListener } from "../listeners/event-listener";
import { AssetManager } from "../game/core/asset-manager";

export class AppState {
  // Observables for UI
  @observable loaded = false;
  @observable started = false;

  gameState?: GameState;

  private assetManager = new AssetManager();
  private events = new EventListener();

  constructor() {
    makeAutoObservable(this);

    // Give loading UI time to mount
    setTimeout(() => this.loadGame(), 10);
  }

  @action startGame = () => {
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
