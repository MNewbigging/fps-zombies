import * as YUKA from "yuka";
import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry";
import { AssetManager } from "../core/asset-manager";
import { GameState, IntersectionData } from "../core/game-state";

export class Level extends YUKA.GameEntity {
  private bulletDecalMaterial: THREE.MeshPhongMaterial;
  private decalHelper = new THREE.Object3D();
  private decalSize = new THREE.Vector3(0.1, 0.1, 0.1);

  constructor(
    public renderComponent: THREE.Object3D,
    private gameState: GameState
  ) {
    super();

    this.canActivateTrigger = false;

    this.bulletDecalMaterial = this.setupBulletDecalMaterial();
  }

  override handleMessage(telegram: YUKA.Telegram): boolean {
    console.log("Level received message:", telegram);

    switch (telegram.message) {
      case "hit":
        {
          const data = telegram.data as IntersectionData;
          if (data.sceneIntersection) {
            this.placeBulletDecal(data.sceneIntersection);
          }
        }
        break;
    }

    return true;
  }

  private setupBulletDecalMaterial() {
    const texture = this.gameState.assetManager.textures.get("bullet-hole");

    const material = new THREE.MeshPhongMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    });

    return material;
  }

  private placeBulletDecal(intersection: THREE.Intersection) {
    if (!intersection.face) {
      return;
    }

    const mesh = intersection.object as THREE.Mesh;

    // Transform local normal to world normal
    const normal = intersection.face.normal.clone();
    normal.transformDirection(mesh.matrixWorld);
    normal.add(intersection.point);

    // Move helper using world values
    this.decalHelper.position.copy(intersection.point);
    this.decalHelper.lookAt(normal);

    // Create decal in world space
    const decalGeom = new DecalGeometry(
      mesh,
      intersection.point,
      this.decalHelper.rotation,
      this.decalSize
    );
    const decal = new THREE.Mesh(decalGeom, this.bulletDecalMaterial);

    this.gameState.scene.add(decal);
  }
}
