import * as YUKA from "yuka";

export class Level extends YUKA.GameEntity {
  constructor() {
    super();

    this.canActivateTrigger = false;
  }

  override handleMessage(telegram: YUKA.Telegram): boolean {
    // Does nothing other than ensure this treats any messages as succesfully handled
    return true;
  }
}
