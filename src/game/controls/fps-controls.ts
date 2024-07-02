import * as YUKA from "yuka";
import { Player } from "../entities/player";

interface Input {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  mouseDown: boolean;
}

const PI05 = Math.PI / 2;

export class FpsControls {
  private enabled = false;

  private input: Input = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    mouseDown: false,
  };

  private elapsed = 0;
  private direction = new YUKA.Vector3();
  private velocity = new YUKA.Vector3();
  private acceleration = 60;
  private brakingPower = 10;
  private movementX = 0;
  private movementY = 0;
  private lookSpeed = 2;

  constructor(private player: Player) {}

  enable() {
    if (this.enabled) {
      return;
    }

    document.addEventListener("keydown", this.onKeyDown, false);
    document.addEventListener("keyup", this.onKeyUp, false);
    document.addEventListener("mousemove", this.onMouseMove, false);
    document.addEventListener("mousedown", this.onMouseDown, false);
    document.addEventListener("mouseup", this.onMouseUp, false);

    document.body.requestPointerLock();

    this.enabled = true;
  }

  disable() {
    if (!this.enabled) {
      return;
    }

    document.removeEventListener("keydown", this.onKeyDown, false);
    document.removeEventListener("keyup", this.onKeyUp, false);
    document.removeEventListener("mousemove", this.onMouseMove, false);
    document.removeEventListener("mousedown", this.onMouseDown, false);
    document.removeEventListener("mouseup", this.onMouseUp, false);

    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      mouseDown: false,
    };

    this.enabled = false;
  }

  update(dt: number) {
    if (!this.enabled) {
      return;
    }

    const speed = this.player.getSpeed();
    this.elapsed += dt * speed;

    this.updateVelocity(dt);
  }

  private updateVelocity(dt: number) {
    const direction = this.direction;
    const velocity = this.velocity;
    const input = this.input;

    velocity.x -= velocity.x * this.brakingPower * dt;
    velocity.z -= velocity.z * this.brakingPower * dt;

    direction.z = Number(input.forward) - Number(input.backward);
    direction.x = Number(input.left) - Number(input.right);
    direction.normalize();

    if (input.forward || input.backward) {
      velocity.z -= direction.z * this.acceleration * dt;
    }

    if (input.left || input.right) {
      velocity.x -= direction.x * this.acceleration * dt;
    }

    this.player.velocity.copy(velocity).applyRotation(this.player.rotation);
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (!this.enabled) {
      return;
    }

    switch (event.key.toLocaleLowerCase()) {
      case "w":
        this.input.forward = true;
        break;
      case "s":
        this.input.backward = true;
        break;
      case "a":
        this.input.left = true;
        break;
      case "d":
        this.input.right = true;
        break;
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    if (!this.enabled) {
      return;
    }

    switch (event.key.toLocaleLowerCase()) {
      case "w":
        this.input.forward = false;
        break;
      case "s":
        this.input.backward = false;
        break;
      case "a":
        this.input.left = false;
        break;
      case "d":
        this.input.right = false;
        break;
    }
  };

  private onMouseMove = (event: MouseEvent) => {
    if (this.enabled) {
      this.movementX -= event.movementX * 0.001 * this.lookSpeed;
      this.movementY -= event.movementY * 0.001 * this.lookSpeed;

      this.movementY = Math.max(-PI05, Math.min(PI05, this.movementY)); // clamp to within half pi of edges

      this.player.rotation.fromEuler(0, this.movementX, 0); // yaw
      this.player.head.rotation.fromEuler(this.movementY, 0, 0);
    }
  };

  private onMouseDown = (event: MouseEvent) => {
    if (this.enabled && event.button === 0) {
      this.input.mouseDown = true;
      this.player.shoot();
    }
  };

  private onMouseUp = (event: MouseEvent) => {
    if (this.enabled && event.button === 0) {
      this.input.mouseDown = false;
    }
  };
}
