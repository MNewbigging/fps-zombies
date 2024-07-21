import { action, makeAutoObservable, observable } from "mobx";
import * as THREE from "three";
import * as YUKA from "yuka";
import * as TWEEN from "@tweenjs/tween.js";
import { AssetManager } from "./asset-manager";
import { Level } from "../entities/level";
import { Player } from "../entities/player";
import { PathPlanner } from "./path-planner";
import { getLargestAbsoluteEntries } from "../utils/utils";
import { ZombieManager } from "./zombie-manager";
import { StatManager } from "./stat-manager";

export interface IntersectionData {
  sceneIntersection?: THREE.Intersection;
  entity?: YUKA.GameEntity;
}

export class GameState {
  @observable paused = false;
  statManager: StatManager;

  scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera();
  private renderer = new THREE.WebGLRenderer({ antialias: true });
  private raycaster = new THREE.Raycaster();

  private time = new YUKA.Time();
  private entityManager = new YUKA.EntityManager();

  level: Level;
  player: Player;
  pathPlanner: PathPlanner;
  zombieManager: ZombieManager;

  constructor(public assetManager: AssetManager) {
    makeAutoObservable(this);

    this.setupScene();

    this.pathPlanner = new PathPlanner(assetManager.navmesh);

    this.level = this.setupLevel();
    this.player = this.setupPlayer();
    this.player.position.set(0, 0, 5);

    this.zombieManager = new ZombieManager(this);

    this.statManager = new StatManager(this.player);
  }

  start() {
    this.zombieManager.startNextWave();

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
    // Turn off matrix auto updates
    renderComponent.matrixAutoUpdate = false;
    renderComponent.updateMatrix();

    renderComponent.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.matrixAutoUpdate = false;
        child.updateMatrix();
      }
    });

    // Add it to the scene
    this.scene.add(renderComponent);

    // Setup the sync callback
    entity.setRenderComponent(renderComponent, sync);

    // Give to entity manager
    this.entityManager.add(entity);
  }

  removeEntity(entity: YUKA.GameEntity) {
    // Remove the entity from manager
    this.entityManager.remove(entity);

    // Remove from any lists
    this.zombieManager.removeZombie(entity);

    // Dispose of threejs render component
    const e = entity as any;
    if (e._renderComponent !== null) {
      const object = e._renderComponent as THREE.Object3D;

      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });

      this.scene.remove(object);
    }
  }

  getShotIntersection(): IntersectionData {
    const data: IntersectionData = {};

    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);

    // Test against zombies first
    for (const zombie of this.zombieManager.zombies) {
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

    // Nothing was hit, return empty data object
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

    // const helper = createConvexRegionHelper(this.assetManager.navmesh);
    // this.scene.add(helper);

    return level;
  }

  private setupPlayer() {
    const player = new Player(this);

    this.camera.matrixAutoUpdate = false;
    player.head.setRenderComponent(this.camera, this.syncCamera);

    this.entityManager.add(player);

    // starting weapon setup
    player.weaponSystem.equipPistol();
    player.weaponSystem.pickupAmmo();
    player.weaponSystem.currentWeapon?.reload();

    const randomRegion = this.assetManager.navmesh.getRandomRegion();
    const regionCenter = randomRegion.computeCentroid().centroid;
    player.position.copy(regionCenter);

    return player;
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
