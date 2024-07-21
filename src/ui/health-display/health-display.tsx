import { observer } from "mobx-react-lite";
import "./health-display.scss";
import React from "react";
import { GameState } from "../../game/core/game-state";

interface HealthDisplayProps {
  gameState: GameState;
}

export const HealthDisplay: React.FC<HealthDisplayProps> = observer(
  ({ gameState }) => {
    const health = gameState.player.health;
    const maxHealth = gameState.statManager.getCurrentStats().maxHealth;

    const healthPercent = (health / maxHealth) * 100;

    return (
      <div className="health-display" style={{ width: `${maxHealth}px` }}>
        <div
          className="health-bar"
          style={{ width: `${healthPercent}%` }}
        ></div>
      </div>
    );
  }
);
