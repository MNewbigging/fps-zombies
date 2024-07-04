import { observer } from "mobx-react-lite";
import { AppState } from "../../app/app-state";
import "./health-display.scss";
import React from "react";

interface HealthDisplayProps {
  appState: AppState;
}

export const HealthDisplay: React.FC<HealthDisplayProps> = observer(
  ({ appState }) => {
    const health = appState.getPlayerHealth();

    return (
      <div className="health-display">
        <div className="health-bar" style={{ width: `${health}%` }}></div>
      </div>
    );
  }
);
