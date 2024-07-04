import { observer } from "mobx-react-lite";
import "./game-screen.scss";
import React from "react";
import { GameState } from "../../game/core/game-state";
import { Reticle } from "../reticle/reticle";

interface GameScreenProps {
  gameState: GameState;
}

export const GameScreen: React.FC<GameScreenProps> = observer(
  ({ gameState }) => {
    return (
      <div className="game-screen">
        <Reticle />
      </div>
    );
  }
);
