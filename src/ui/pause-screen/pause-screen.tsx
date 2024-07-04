import { observer } from "mobx-react-lite";
import "./pause-screen.scss";
import React from "react";
import { GameState } from "../../game/core/game-state";

interface PauseScreenProps {
  gameState: GameState;
}

export const PauseScreen: React.FC<PauseScreenProps> = observer(
  ({ gameState }) => {
    return (
      <div className="pause-screen">
        <div className="menu-button" onClick={gameState.resume}>
          Resume
        </div>
      </div>
    );
  }
);
