import * as YUKA from "yuka";
import * as THREE from "three";

export class Level extends YUKA.GameEntity {
  constructor(public renderComponent: THREE.Object3D) {
    super();

    this.canActivateTrigger = false;
  }

  override handleMessage(telegram: YUKA.Telegram): boolean {
    // Does nothing other than ensure this treats any messages as succesfully handled
    return true;
  }
}
