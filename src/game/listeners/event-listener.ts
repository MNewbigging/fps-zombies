import * as THREE from "three";
import * as YUKA from "yuka";
import { Zombie } from "../entities/zombie";

// Todo - find a better place for stuff like this
export interface EntityAnimationEvent {
  entity: YUKA.GameEntity;
  animName: string;
}

export interface EventMap {
  "entity-anim-end": EntityAnimationEvent;
  "entity-anim-loop": EntityAnimationEvent;
  "zombie-died": Zombie;
}

type EventCallback = (event: any) => void;

export class EventListener {
  private events = new Map<keyof EventMap, EventCallback[]>();

  on<E extends keyof EventMap>(
    type: E,
    listener: (event: EventMap[E]) => void
  ) {
    const callbacks = this.events.get(type) ?? [];
    callbacks.push(listener);
    this.events.set(type, callbacks);
  }

  off<E extends keyof EventMap>(
    type: E,
    listener: (event: EventMap[E]) => void
  ) {
    const callbacks = this.events.get(type)?.filter((cb) => cb !== listener);
    this.events.set(type, callbacks ?? []);
  }

  fire<E extends keyof EventMap>(type: E, event: EventMap[E]) {
    const callbacks = this.events.get(type) ?? [];
    callbacks.forEach((cb) => cb(event));
  }
}

export const eventListener = new EventListener();
