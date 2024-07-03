import * as TWEEN from "@tweenjs/tween.js";
import * as YUKA from "yuka";
import { Weapon } from "../weapons/weapon";

export class TweenFactory {
  static recoilWeapon(weapon: Weapon, onComplete: () => void) {
    const startPos = weapon.position.clone();

    // move this into weapon later
    const recoilPosMod = new YUKA.Vector3(0, 0.02, 0.1);

    const targetPos = startPos.clone().add(recoilPosMod);

    const maxDuration = weapon.msBetweenShots * 0.9;
    const outDuration = Math.ceil(maxDuration / 4);
    const backDuration = maxDuration - outDuration;

    const out = new TWEEN.Tween(weapon).to(
      {
        position: { y: targetPos.y, z: targetPos.z },
      },
      outDuration
    );

    const back = new TWEEN.Tween(weapon)
      .to(
        {
          position: { y: startPos.y, z: startPos.z },
        },
        backDuration
      )
      .onComplete(onComplete);

    out.chain(back);

    return out;
  }
}
