import { Pickup } from "./pickup";

export class HealthPickup extends Pickup {
  override onPickup(): void {
    this.player.addHealth(50);
  }
}
