import { observer } from "mobx-react-lite";
import "./pause-screen.scss";
import React from "react";
import { GameState } from "../../game/core/game-state";
import { StatRow } from "./stat-row";

interface PauseScreenProps {
  gameState: GameState;
}

export const PauseScreen: React.FC<PauseScreenProps> = observer(
  ({ gameState }) => {
    const statMgr = gameState.statManager;

    const upgradePoints = statMgr.upgradePoints;
    const upgradedStats = statMgr.upgradedStats;
    const currentStats = statMgr.getCurrentStats();

    return (
      <div className="pause-screen">
        <div className="window">
          <div className="stats-area">
            <div className="upgrade-points">Upgrade points {upgradePoints}</div>

            <StatRow
              name="Max health"
              curValue={currentStats.maxHealth}
              upgradedValue={upgradedStats.maxHealth}
              onLeftClick={statMgr.increaseMaxHealth}
              onRightClick={statMgr.decreaseMaxHealth}
            />
            <StatRow
              name="Move speed"
              curValue={currentStats.moveSpeed}
              upgradedValue={upgradedStats.moveSpeed}
              onLeftClick={statMgr.increaseMoveSpeed}
              onRightClick={statMgr.decreaseMoveSpeed}
            />
          </div>

          <div
            className="resume-button"
            onClick={() => {
              statMgr.applyUpgrades();
              gameState.resume();
            }}
          >
            Resume
          </div>
        </div>
      </div>
    );
  }
);
