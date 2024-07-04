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

  static zombieEmissiveFlash(object: THREE.Mesh, colour: THREE.Color) {
    const zombieChild = object.children[1] as THREE.SkinnedMesh;
    const material = zombieChild.material as THREE.MeshLambertMaterial;
    material.emissive = colour.clone();
    material.emissiveIntensity = 0;

    const startValue = 0;
    const endValue = 0.5;

    const outDuration = 100;
    const backDuration = 100;

    const out = new TWEEN.Tween(material).to(
      {
        emissiveIntensity: endValue,
      },
      outDuration
    );

    const back = new TWEEN.Tween(material).to(
      {
        emissiveIntensity: startValue,
      },
      backDuration
    );

    out.chain(back);

    return out;
  }

  static zombieFadeOut(object: THREE.Mesh) {
    const zombieChild = object.children[1] as THREE.SkinnedMesh;
    const material = zombieChild.material as THREE.MeshLambertMaterial;

    material.transparent = true;
    material.opacity = 1;

    const duration = 2000;

    const out = new TWEEN.Tween(material).to({ opacity: 0 }, duration);

    return out;
  }
}
