import { action, makeAutoObservable, observable } from "mobx";
import * as THREE from "three";
import * as YUKA from "yuka";
import * as TWEEN from "@tweenjs/tween.js";
import { AssetManager } from "./asset-manager";
import { Level } from "../entities/level";
import { Player } from "../entities/player";
import { Zombie } from "../entities/zombie";
import { PathPlanner } from "./path-planner";
import { getLargestAbsoluteEntries } from "../utils/utils";

export interface IntersectionData {
  sceneIntersection?: THREE.Intersection;
  entity?: YUKA.GameEntity;
}

export class GameState {
  @observable paused = false;

  scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera();
  private renderer = new THREE.WebGLRenderer({ antialias: true });
  private raycaster = new THREE.Raycaster();

  private time = new YUKA.Time();
  private entityManager = new YUKA.EntityManager();

  level: Level;
  player: Player;
  pathPlanner: PathPlanner;
  private zombies: Zombie[] = [];

  constructor(public assetManager: AssetManager) {
    makeAutoObservable(this);

    this.setupScene();

    // const helper = createConvexRegionHelper(assetManager.navmesh);
    // this.scene.add(helper);

    this.pathPlanner = new PathPlanner(assetManager.navmesh);

    this.level = this.setupLevel();
    this.player = this.setupPlayer();
    const zombie1 = this.setupZombie(new YUKA.Vector3(2, 0, -1));
    const zombie2 = this.setupZombie(new YUKA.Vector3(2, 0, -5));
    this.zombies.push(zombie1, zombie2);
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

  /**
   * Returns the intersection point from raycasting into the scene from camera's current pov
   */
  getIntersection(): IntersectionData {
    const data: IntersectionData = {};

    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);

    // Test against zombies first
    for (const zombie of this.zombies) {
      const zombieIntersections = this.raycaster.intersectObject(
        zombie.renderComponent,
        true
      );
      if (zombieIntersections.length) {
        data.sceneIntersection = zombieIntersections[0];
        data.entity = zombie;

        return data;
      }
    }

    // Test for intersections against level
    const levelIntersections = this.raycaster.intersectObject(
      this.level.renderComponent,
      true
    );
    if (levelIntersections.length) {
      // Hit the level
      data.sceneIntersection = levelIntersections[0];
      data.entity = this.level;

      return data;
    }

    return data;
  }

  debugShot(shotRay: YUKA.Ray, targetPosition: YUKA.Vector3) {
    // Create a debug line to visualise the shot
    const lineMat = new THREE.LineBasicMaterial({ color: 0xff0000 });

    const points: THREE.Vector3[] = [
      new THREE.Vector3(shotRay.origin.x, shotRay.origin.y, shotRay.origin.z),
      new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z),
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, lineMat);
    this.scene.add(line);
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
    const level = new Level(renderComponent, this);
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

    return level;
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
        child.material = new THREE.MeshLambertMaterial({
          map: texture,
          vertexColors: false,
          transparent: true,
          opacity: 1,
        });
      }
    });

    const zombie = new Zombie(renderComponent, this);
    zombie.scale.multiplyScalar(0.01);
    zombie.position.copy(position);
    this.addEntity(zombie, renderComponent);

    return zombie;
  }

  private update = () => {
    requestAnimationFrame(this.update);

    this.time.update();
    const dt = this.time.getDelta();

    if (!this.paused) {
      this.entityManager.update(dt);

      this.pathPlanner.update();

      TWEEN.update();
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
