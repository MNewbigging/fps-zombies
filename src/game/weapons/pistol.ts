import * as YUKA from "yuka";
import { Weapon } from "./weapon";
import { Player } from "../entities/player";

export class Pistol extends Weapon {
  constructor(public player: Player) {
    super(player);

    // setup pistol properties

    this.magAmmo = 12;
    this.magLimit = 12;
    this.reserveAmmo = 12;
    this.reserveLimit = 120;
    this.setRpm(260);

    // synty model is overlarge

    this.scale.multiplyScalar(0.01);
    this.rotation.fromEuler(0, Math.PI, 0);
    this.position.set(0.15, -0.15, -0.5);
  }
}
