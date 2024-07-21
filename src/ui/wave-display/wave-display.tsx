import { observer } from "mobx-react-lite";
import "./wave-display.scss";
import React from "react";
import { AppState } from "../../app/app-state";

interface WaveDisplayProps {
  appState: AppState;
}

export const WaveDisplay: React.FC<WaveDisplayProps> = observer(
  ({ appState }) => {
    const currentWave = appState.getCurrentWave();
    const remainingZombies = appState.getRemainingWaveZombies();

    return (
      <div className="wave-display">
        Wave {currentWave} | Zombies {remainingZombies}
      </div>
    );
  }
);
