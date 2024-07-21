import { Pickup } from "./pickup";

export class AmmoPickup extends Pickup {
  override onPickup(): void {
    this.player.weaponSystem.pickupAmmo();
  }
}
