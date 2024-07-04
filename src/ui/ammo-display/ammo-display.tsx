import { observer } from "mobx-react-lite";
import "./ammo-display.scss";
import React from "react";
import { AppState } from "../../app/app-state";

interface AmmoDisplayProps {
  appState: AppState;
}

export const AmmoDisplay: React.FC<AmmoDisplayProps> = observer(
  ({ appState }) => {
    const ammo = appState.getCurrentMagAmmo();
    const reserve = appState.getCurrentReserveAmmo();

    return (
      <div className="ammo-display">
        <span className="ammo">{ammo} | </span>
        <span className="reserve">{reserve}</span>
      </div>
    );
  }
);
