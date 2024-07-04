import { observer } from "mobx-react-lite";
import "./game-screen.scss";
import React from "react";
import { Reticle } from "../reticle/reticle";
import { AmmoDisplay } from "../ammo-display/ammo-display";
import { AppState } from "../../app/app-state";

interface GameScreenProps {
  appState: AppState;
}

export const GameScreen: React.FC<GameScreenProps> = observer(
  ({ appState }) => {
    return (
      <div className="game-screen">
        <Reticle />
        <AmmoDisplay appState={appState} />
      </div>
    );
  }
);
