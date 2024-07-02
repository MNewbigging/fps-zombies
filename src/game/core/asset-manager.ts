import * as YUKA from "yuka";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

export class AssetManager {
  textures = new Map();
  models = new Map();
  animations = new Map();
  navmesh!: YUKA.NavMesh; // this ! beats a whole load of if statements elsewhere (remind me why i'm using ts again?)

  private loadingManager = new THREE.LoadingManager();

  cloneModel(name: string): THREE.Object3D {
    const model = this.models.get(name);
    if (model) {
      return SkeletonUtils.clone(model);
    }

    // Ensure we always return an object 3d
    return new THREE.Mesh(
      new THREE.SphereGeometry(),
      new THREE.MeshBasicMaterial({ color: "red" })
    );
  }

  applyModelTexture(model: THREE.Object3D, textureName: string) {
    const texture = this.textures.get(textureName);
    if (!texture) {
      return;
    }

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.map = texture;
      }
    });
  }

  load(): Promise<void> {
    const rgbeLoader = new RGBELoader(this.loadingManager);
    const textureLoader = new THREE.TextureLoader(this.loadingManager);
    const gltfLoader = new GLTFLoader(this.loadingManager);
    const fbxLoader = new FBXLoader(this.loadingManager);

    this.loadTextures(rgbeLoader, textureLoader);
    this.loadModels(gltfLoader, fbxLoader);
    this.loadNavmesh();
    this.loadAnimations(fbxLoader);

    return new Promise((resolve) => {
      this.loadingManager.onLoad = () => {
        resolve();
      };
    });
  }

  private loadTextures(
    rgbeLoader: RGBELoader,
    textureLoader: THREE.TextureLoader
  ) {
    // hdr skybox

    const hdriUrl = new URL("/textures/orchard_cartoony.hdr", import.meta.url)
      .href;
    const hdriTexture = rgbeLoader.load(hdriUrl);
    hdriTexture.matrixAutoUpdate = false;
    hdriTexture.mapping = THREE.EquirectangularReflectionMapping;
    this.textures.set("hdri", hdriTexture);

    // zombie texture atlas

    const zombieUrl = new URL(
      "/textures/PolygonZombie_Texture_01_A.png",
      import.meta.url
    ).href;
    const zombieTexture = textureLoader.load(zombieUrl);
    zombieTexture.matrixAutoUpdate = false;
    zombieTexture.encoding = THREE.sRGBEncoding;
    this.textures.set("zombie-atlas", zombieTexture);

    // weapon texture atlas

    const weaponUrl = new URL("/textures/Wep_Skin_26.png", import.meta.url)
      .href;
    const weaponTexture = textureLoader.load(weaponUrl);
    weaponTexture.matrixAutoUpdate = false;
    weaponTexture.encoding = THREE.sRGBEncoding;
    this.textures.set("weapon-atlas", weaponTexture);

    // battle royale texture atlas

    const brUrl = new URL(
      "/textures/PolygonBattleRoyale_Texture_01_A.png",
      import.meta.url
    ).href;
    const brTexture = textureLoader.load(brUrl);
    brTexture.matrixAutoUpdate = false;
    brTexture.encoding = THREE.sRGBEncoding;
    this.textures.set("battle-royale-atlas", brTexture);

    // bullet hole

    const bulletHoleUrl = new URL("/textures/bullet_hole.png", import.meta.url)
      .href;
    const bulletHoleTexture = textureLoader.load(bulletHoleUrl);
    bulletHoleTexture.matrixAutoUpdate = false;
    this.textures.set("bullet-hole", bulletHoleTexture);

    // bullet trail

    const bulletTrailUrl = new URL("/textures/trace_06.png", import.meta.url)
      .href;
    const bulletTrailTexture = textureLoader.load(bulletTrailUrl);
    bulletTrailTexture.matrixAutoUpdate = false;
    this.textures.set("bullet-trail", bulletTrailTexture);
  }

  private loadModels(gltfLoader: GLTFLoader, fbxLoader: FBXLoader) {
    // level

    const levelUrl = new URL("/models/level.glb", import.meta.url).href;
    gltfLoader.load(levelUrl, (gltf) => {
      const renderComponent = gltf.scene;
      this.prepModel(renderComponent);
      this.models.set("level", renderComponent);
    });

    // zombie

    const zombieUrl = new URL(
      "/models/SK_Zombie_Businessman_Male_01.fbx",
      import.meta.url
    ).href;
    fbxLoader.load(zombieUrl, (group) => {
      this.prepModel(group);
      group.name = "zombie";
      this.models.set("zombie", group);
    });

    // pistol

    const pistolUrl = new URL("/models/pistol.fbx", import.meta.url).href;
    fbxLoader.load(pistolUrl, (group) => {
      this.prepModel(group);
      this.models.set("pistol", group);
    });

    // bullet

    const bulletUrl = new URL(
      "/models/SM_Wep_Pistol_Bullet_01.fbx",
      import.meta.url
    ).href;
    fbxLoader.load(bulletUrl, (group) => {
      this.models.set("bullet", group);
    });

    // bullet line

    const bulletLineGeom = new THREE.BufferGeometry();
    const bulletLineMat = new THREE.LineBasicMaterial({ color: 0xfbf8e6 });

    bulletLineGeom.setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(0, 0, -1),
    ]);

    const bulletLine = new THREE.LineSegments(bulletLineGeom, bulletLineMat);
    bulletLine.matrixAutoUpdate = false;

    this.models.set("bullet-line", bulletLine);

    // bullet trail

    const bulletTrail = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new THREE.MeshBasicMaterial({
        color: "yellow",
        transparent: true,
        side: THREE.DoubleSide,
      })
    );
    this.models.set("bullet-trail", bulletTrail);
  }

  private prepModel(model: THREE.Object3D) {
    model.matrixAutoUpdate = false;
    model.updateMatrix();

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.matrixAutoUpdate = false;
        child.updateMatrix();
      }
    });
  }

  private loadNavmesh() {
    const navmeshLoader = new YUKA.NavMeshLoader();

    this.loadingManager.itemStart("navmesh");

    const url = new URL("/models/navmesh.gltf", import.meta.url).href;

    navmeshLoader.load(url).then((navmesh) => {
      this.navmesh = navmesh;
      this.loadingManager.itemEnd("navmesh");
    });
  }

  private loadAnimations(fbxLoader: FBXLoader) {
    const zombieIdleUrl = new URL("/anims/zombie-idle.fbx", import.meta.url)
      .href;
    fbxLoader.load(zombieIdleUrl, (group) => {
      if (group.animations.length) {
        const idleClip = group.animations[0]; // only one animation present in the file
        idleClip.name = "zombie-idle";
        this.animations.set(idleClip.name, idleClip);
      }
    });

    const zombieWalkUrl = new URL("/anims/zombie-walk.fbx", import.meta.url)
      .href;
    fbxLoader.load(zombieWalkUrl, (group) => {
      if (group.animations.length) {
        const walkClip = group.animations[0];
        walkClip.name = "zombie-walk";
        this.animations.set(walkClip.name, walkClip);
      }
    });

    const zombieAttackUrl = new URL("/anims/zombie-attack.fbx", import.meta.url)
      .href;
    fbxLoader.load(zombieAttackUrl, (group) => {
      if (group.animations.length) {
        const walkClip = group.animations[0];
        walkClip.name = "zombie-attack";
        this.animations.set(walkClip.name, walkClip);
      }
    });
  }
}
