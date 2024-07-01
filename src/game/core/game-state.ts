import { action, makeAutoObservable, observable } from "mobx";
import * as THREE from "three";
import * as YUKA from "yuka";
import { AssetManager } from "./asset-manager";
import { Level } from "../entities/level";
import { Player } from "../entities/player";
import { Zombie } from "../entities/zombie";
import { PathPlanner } from "./path-planner";
import { getLargestAbsoluteEntries } from "../utils/utils";

export class GameState {
  @observable paused = false;

  scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera();
  private renderer = new THREE.WebGLRenderer({ antialias: true });

  private time = new YUKA.Time();
  private entityManager = new YUKA.EntityManager();

  navmesh: YUKA.NavMesh;

  private player: Player;
  private pathPlanner: PathPlanner;

  constructor(public assetManager: AssetManager) {
    makeAutoObservable(this);

    this.setupScene();

    this.navmesh = assetManager.navmesh;
    // const helper = createConvexRegionHelper(assetManager.navmesh);
    // this.scene.add(helper);

    this.pathPlanner = new PathPlanner(assetManager.navmesh);

    this.setupLevel();
    this.player = this.setupPlayer();
    this.setupZombie(new YUKA.Vector3(2, 0, -1));
    this.setupZombie(new YUKA.Vector3(2, 0, -5));
  }

  start() {
    this.update();
  }

  @action pause() {
    this.player.fpsControls.disable();
    this.paused = true;
  }

  @action resume = () => {
    this.player.fpsControls.enable();
    this.paused = false;
  };

  addEntity(entity: YUKA.GameEntity, renderComponent: THREE.Object3D) {
    renderComponent.matrixAutoUpdate = false;
    this.scene.add(renderComponent);
    entity.setRenderComponent(renderComponent, sync);
    this.entityManager.add(entity);
  }

  removeEntity(entity: YUKA.GameEntity) {
    this.entityManager.remove(entity);

    const e = entity as any;
    if (e._renderComponent !== null) {
      this.scene.remove(e._renderComponent);
    }
  }

  checkProjectileIntersection() {
    /**
     * Should accept a projectile game entity as an argument
     * Projectile has a reference to its owner (player)
     *
     * It looks like the BVH would require the level object to be a single geometry,
     * right now it it made up of multiple objects. I could do it when the level is
     * finalised though.
     *
     * Dive uses custom hardcoded bounding boxes for the enemies, which I don't want
     * to work out myself for the zombies just now.
     *
     * Even though the AABBs and BVH would be quicker to test against, I will just
     * use three raycaster against render components for now. The zombies have no
     * children so I wouldn't need it to traverse many objects.
     *
     * What this needs to do:
     * - Accept a projectile yuka entity
     * - Create a three raycaster set from camera
     * - Raycast against render comps of level and zombies
     * - If static object hit, place decal
     * - If enemy hit, get its reference and do more stuff
     * - Update the player's gun that has now fired
     *
     * -
     */
  }

  private setupScene() {
    // skybox

    const hdri = this.assetManager.textures.get("hdri");
    this.scene.environment = hdri;
    this.scene.background = hdri;

    // camera

    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );

    // lights

    const ambientLight = new THREE.AmbientLight(undefined, 0.25);
    this.scene.add(ambientLight);

    const directLight = new THREE.DirectionalLight(undefined, Math.PI);
    directLight.position.copy(new THREE.Vector3(0.75, 1, 0.75).normalize());
    this.scene.add(directLight);

    // renderer

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    window.addEventListener("resize", this.onWindowResize, false);

    const canvasRoot = document.getElementById("canvas-root");
    canvasRoot?.appendChild(this.renderer.domElement);

    document.addEventListener("pointerlockchange", this.onPointerLockChange);
    document.addEventListener("pointerlockerror", this.onPointerLockError);
  }

  private setupLevel() {
    const renderComponent = this.assetManager.models.get(
      "level"
    ) as THREE.Object3D;
    const level = new Level();
    level.name = "level";
    this.addEntity(level, renderComponent);
    console.log("level", renderComponent);

    // spatial index

    const levelBounds = new THREE.Box3().setFromObject(renderComponent);
    // pull out the largest values in either direction from bounds
    const largestValues = getLargestAbsoluteEntries(
      levelBounds.min,
      levelBounds.max
    );
    const cells = 5;

    // spatial index is centred, so double the sizes
    const width = largestValues.x * 2;
    const height = largestValues.y * 2;
    const depth = largestValues.z * 2;
    const cellsX = cells;
    const cellsY = 1;
    const cellsZ = cells;

    this.assetManager.navmesh.spatialIndex = new YUKA.CellSpacePartitioning(
      width,
      height,
      depth,
      cellsX,
      cellsY,
      cellsZ
    );
    this.assetManager.navmesh.updateSpatialIndex();

    // const helper = createCellSpaceHelper(
    //   this.assetManager.navmesh.spatialIndex
    // );
    // this.scene.add(helper);
  }

  private setupPlayer() {
    const player = new Player(this);

    this.camera.matrixAutoUpdate = false;
    player.head.setRenderComponent(this.camera, this.syncCamera);

    this.entityManager.add(player);

    player.weaponSystem.equipPistol();

    return player;
  }

  private setupZombie(position: YUKA.Vector3) {
    const renderComponent = this.assetManager.cloneModel("zombie");
    const texture = this.assetManager.textures.get("zombie-atlas");
    renderComponent.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.map = texture;
        child.material.vertexColors = false;
      }
    });

    const zombie = new Zombie(
      this.pathPlanner,
      this.player,
      this.assetManager.navmesh
    );
    zombie.scale.multiplyScalar(0.01);
    zombie.position.copy(position);
    this.addEntity(zombie, renderComponent);

    const mixer = new THREE.AnimationMixer(renderComponent);
    const idleClip = this.assetManager.animations.get("zombie-idle");
    const walkClip = this.assetManager.animations.get("zombie-walk");
    const attackClip = this.assetManager.animations.get("zombie-attack");
    const clips = [idleClip, walkClip, attackClip];
    zombie.setAnimations(mixer, clips);
  }

  private update = () => {
    requestAnimationFrame(this.update);

    this.time.update();
    const dt = this.time.getDelta();

    if (!this.paused) {
      this.entityManager.update(dt);

      this.pathPlanner.update();
    }

    this.renderer.clear();

    this.renderer.render(this.scene, this.camera);
  };

  private syncCamera = (
    yukaEntity: YUKA.GameEntity,
    camera: THREE.PerspectiveCamera
  ) => {
    const matrix = yukaEntity.worldMatrix as unknown;
    camera.matrixWorld.copy(matrix as THREE.Matrix4);
  };

  private onWindowResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  private onPointerLockChange = () => {
    // If exiting
    if (!document.pointerLockElement) {
      this.pause();
    }
  };

  private onPointerLockError = () => {
    this.pause();
  };
}

export function sync(
  yukaEntity: YUKA.GameEntity,
  renderComponent: THREE.Object3D
) {
  const matrix = yukaEntity.worldMatrix as unknown;
  renderComponent.matrix.copy(matrix as THREE.Matrix4);
}
