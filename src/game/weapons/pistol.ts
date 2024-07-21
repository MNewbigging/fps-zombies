import * as YUKA from "yuka";
import * as THREE from "three";
import { Weapon } from "./weapon";
import { Player } from "../entities/player";

export class Pistol extends Weapon {
  constructor(public player: Player, public renderComponent: THREE.Object3D) {
    super(player, renderComponent);

    // setup pistol properties

    this.magLimit = 12;
    this.reserveLimit = 120;
    this.setRpm(300);

    // synty model is overlarge

    this.scale.multiplyScalar(0.01);
    this.rotation.fromEuler(0, Math.PI, 0);
    this.position.set(0.15, -0.15, -0.5);

    // muzzle is a child, position it relative to gun

    this.muzzle.position.set(0, 8, 50);
  }
}
