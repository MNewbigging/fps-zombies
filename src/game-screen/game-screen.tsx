import { observer } from "mobx-react-lite";
import { GameState } from "../game/core/game-state";
import "./game-screen.scss";
import React from "react";
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
