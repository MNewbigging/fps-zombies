import "./stat-row.scss";
import { observer } from "mobx-react-lite";
import React from "react";

interface StatRowProps {
  name: string;
  curValue: number;
  upgradedValue: number;
  onLeftClick: () => void;
  onRightClick: () => void;
}

export const StatRow: React.FC<StatRowProps> = observer(
  ({ name, curValue, upgradedValue, onLeftClick, onRightClick }) => {
    const valueClass = curValue !== upgradedValue ? "changed" : "";

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
      if (e.button === 0) {
        onLeftClick();
      }
    };

    return (
      <div
        className="stat-row"
        onClick={onClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onRightClick();
        }}
      >
        {name} <span className={`${valueClass}`}>{upgradedValue}</span>
      </div>
    );
  }
);
