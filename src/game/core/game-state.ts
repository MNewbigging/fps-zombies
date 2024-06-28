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

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera();
  private renderer = new THREE.WebGLRenderer({ antialias: true });

  private time = new YUKA.Time();
  private entityManager = new YUKA.EntityManager();
  private player: Player;
  private pathPlanner: PathPlanner;

  constructor(private assetManager: AssetManager) {
    makeAutoObservable(this);

    this.setupScene();

    // const helper = createConvexRegionHelper(assetManager.navmesh);
    // this.scene.add(helper);

    this.pathPlanner = new PathPlanner(this.assetManager.navmesh);

    this.setupLevel();
    this.player = this.setupPlayer();
    this.setupZombie();
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
    entity.setRenderComponent(renderComponent, this.sync);
    this.entityManager.add(entity);
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
    const player = new Player(this.assetManager.navmesh);

    this.camera.matrixAutoUpdate = false;
    player.head.setRenderComponent(this.camera, this.syncCamera);

    this.entityManager.add(player);

    return player;
  }

  private setupZombie() {
    const renderComponent = this.assetManager.models.get(
      "zombie"
    ) as THREE.Object3D;
    const texture = this.assetManager.textures.get("zombie-atlas");
    renderComponent.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.map = texture;
        child.material.vertexColors = false;
      }
    });

    const zombie = new Zombie(this.pathPlanner, this.player);
    zombie.scale.multiplyScalar(0.01);
    zombie.position.set(2, 0, -5);
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

  private sync = (
    yukaEntity: YUKA.GameEntity,
    renderComponent: THREE.Object3D
  ) => {
    const matrix = yukaEntity.worldMatrix as unknown;
    renderComponent.matrix.copy(matrix as THREE.Matrix4);
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
